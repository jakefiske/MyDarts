using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace MyDarts.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SystemController : ControllerBase
    {
        private readonly ILogger<SystemController> _logger;
        private static string _currentOrientation = "landscape";

        public SystemController(ILogger<SystemController> logger)
        {
            _logger = logger;
        }

        private bool IsLinux => RuntimeInformation.IsOSPlatform(OSPlatform.Linux);

        private (bool success, string output, string error) RunCommand(string command, string args, int timeoutMs = 5000)
        {
            if (!IsLinux)
            {
                return (false, "", "Not running on Linux");
            }

            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = command,
                    Arguments = args,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(psi);
                if (process == null)
                    return (false, "", "Failed to start process");

                process.WaitForExit(timeoutMs);

                var output = process.StandardOutput.ReadToEnd();
                var error = process.StandardError.ReadToEnd();

                return (process.ExitCode == 0, output, error);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running command: {Command} {Args}", command, args);
                return (false, "", ex.Message);
            }
        }

        /// <summary>
        /// Get system status (network, hostname, etc.)
        /// </summary>
        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            if (!IsLinux)
            {
                return Ok(new
                {
                    platform = "Windows",
                    hostname = Environment.MachineName,
                    connected = true,
                    internet = true,
                    ipAddresses = new[] { "127.0.0.1" },
                    orientation = _currentOrientation
                });
            }

            var ipAddresses = new List<string>();
            var (ipSuccess, ipOutput, _) = RunCommand("hostname", "-I");
            if (ipSuccess && !string.IsNullOrWhiteSpace(ipOutput))
            {
                ipAddresses = ipOutput.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries).ToList();
            }

            var hostname = Environment.MachineName;
            var (hostnameSuccess, hostnameOutput, _) = RunCommand("hostname", "");
            if (hostnameSuccess && !string.IsNullOrWhiteSpace(hostnameOutput))
            {
                hostname = hostnameOutput.Trim();
            }

            var (pingSuccess, _, _) = RunCommand("ping", "-c 1 -W 2 8.8.8.8");

            // Get WiFi info
            string? ssid = null;
            string? signal = null;
            var (wifiSuccess, wifiOutput, _) = RunCommand("iwconfig", "wlan0");
            if (wifiSuccess)
            {
                if (wifiOutput.Contains("ESSID:\""))
                {
                    var start = wifiOutput.IndexOf("ESSID:\"") + 7;
                    var end = wifiOutput.IndexOf("\"", start);
                    if (end > start)
                        ssid = wifiOutput.Substring(start, end - start);
                }
                if (wifiOutput.Contains("Signal level="))
                {
                    var start = wifiOutput.IndexOf("Signal level=") + 13;
                    var end = wifiOutput.IndexOf(" ", start);
                    if (end > start)
                        signal = wifiOutput.Substring(start, end - start);
                }
            }

            return Ok(new
            {
                platform = "Linux",
                hostname,
                connected = ipAddresses.Count > 0,
                internet = pingSuccess,
                ipAddresses,
                orientation = _currentOrientation,
                wifi = new { ssid, signal }
            });
        }

        /// <summary>
        /// Reboot the Pi
        /// </summary>
        [HttpPost("reboot")]
        public IActionResult Reboot()
        {
            if (!IsLinux)
            {
                return Ok(new { success = false, message = "Not running on Linux" });
            }

            var (success, _, error) = RunCommand("sudo", "reboot");
            return Ok(new
            {
                success = success || string.IsNullOrEmpty(error), // reboot may not return
                message = success ? "Rebooting..." : error
            });
        }

        /// <summary>
        /// Shutdown the Pi
        /// </summary>
        [HttpPost("shutdown")]
        public IActionResult Shutdown()
        {
            if (!IsLinux)
            {
                return Ok(new { success = false, message = "Not running on Linux" });
            }

            var (success, _, error) = RunCommand("sudo", "shutdown -h now");
            return Ok(new
            {
                success = success || string.IsNullOrEmpty(error),
                message = success ? "Shutting down..." : error
            });
        }

        /// <summary>
        /// Rotate display
        /// </summary>
        [HttpPost("rotate")]
        public IActionResult Rotate([FromQuery] string orientation = "landscape")
        {
            if (!IsLinux)
            {
                _currentOrientation = orientation;
                return Ok(new { success = true, orientation = _currentOrientation, message = "Simulated (not on Linux)" });
            }

            // Try to detect display
            var (xrandrSuccess, xrandrOutput, _) = RunCommand("xrandr", "");
            if (!xrandrSuccess)
            {
                return Ok(new { success = false, message = "Could not detect display" });
            }

            // Find connected display
            string? displayName = null;
            foreach (var line in xrandrOutput.Split('\n'))
            {
                if (line.Contains(" connected"))
                {
                    displayName = line.Split(' ')[0];
                    break;
                }
            }

            if (string.IsNullOrEmpty(displayName))
            {
                return Ok(new { success = false, message = "No display found" });
            }

            var rotation = orientation.ToLower() switch
            {
                "portrait" => "right",
                "portrait-left" => "left",
                "inverted" => "inverted",
                _ => "normal"
            };

            var (success, _, error) = RunCommand("xrandr", $"--output {displayName} --rotate {rotation}");

            if (success)
            {
                _currentOrientation = orientation;
            }

            return Ok(new
            {
                success,
                orientation = _currentOrientation,
                message = success ? $"Rotated to {orientation}" : error
            });
        }

        /// <summary>
        /// Toggle orientation between landscape and portrait
        /// </summary>
        [HttpPost("toggle-orientation")]
        public IActionResult ToggleOrientation()
        {
            var newOrientation = _currentOrientation == "landscape" ? "portrait" : "landscape";
            return Rotate(newOrientation);
        }

        /// <summary>
        /// Minimize window (kiosk mode)
        /// </summary>
        [HttpPost("window/minimize")]
        public IActionResult MinimizeWindow()
        {
            if (!IsLinux)
            {
                return Ok(new { success = false, message = "Not running on Linux" });
            }

            // Try wmctrl first
            var (wmctrlExists, _, _) = RunCommand("which", "wmctrl");
            if (wmctrlExists)
            {
                var (success, _, _) = RunCommand("wmctrl", "-r :ACTIVE: -b add,hidden");
                if (success)
                    return Ok(new { success = true, message = "Window minimized" });
            }

            // Try xdotool
            var (xdoSuccess, _, _) = RunCommand("xdotool", "getactivewindow windowminimize");
            return Ok(new
            {
                success = xdoSuccess,
                message = xdoSuccess ? "Window minimized" : "Could not minimize - try installing wmctrl"
            });
        }

        /// <summary>
        /// Restore/maximize window
        /// </summary>
        [HttpPost("window/restore")]
        public IActionResult RestoreWindow()
        {
            if (!IsLinux)
            {
                return Ok(new { success = false, message = "Not running on Linux" });
            }

            var (success, _, error) = RunCommand("xdotool", "search --name Chromium windowactivate windowmaximize");
            return Ok(new
            {
                success,
                message = success ? "Window restored" : error
            });
        }

        /// <summary>
        /// Close kiosk
        /// </summary>
        [HttpPost("window/close")]
        public IActionResult CloseWindow()
        {
            if (!IsLinux)
            {
                return Ok(new { success = false, message = "Not running on Linux" });
            }

            var (success, _, _) = RunCommand("pkill", "-f chromium.*kiosk");
            return Ok(new { success = true, message = "Kiosk closed" });
        }
    }
}