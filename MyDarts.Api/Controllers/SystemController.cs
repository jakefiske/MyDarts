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
        /// Get status of all services
        /// </summary>
        [HttpGet("services")]
        public IActionResult GetServiceStatuses()
        {
            var statuses = new
            {
                autodarts = IsServiceRunning("autodarts"),
                dartsCaller = IsServiceRunning("darts-caller")
            };
            return Ok(statuses);
        }

        /// <summary>
        /// Control a service (start/stop/restart)
        /// </summary>
        [HttpPost("service/{serviceName}/{action}")]
        public async Task<IActionResult> ServiceAction(string serviceName, string action)
        {
            try
            {
                var validServices = new[] { "autodarts", "darts-caller", "mydarts" };
                if (!validServices.Contains(serviceName))
                {
                    return BadRequest(new { success = false, message = "Invalid service name" });
                }

                var validActions = new[] { "start", "stop", "restart" };
                if (!validActions.Contains(action))
                {
                    return BadRequest(new { success = false, message = "Invalid action" });
                }

                var startInfo = new ProcessStartInfo
                {
                    FileName = "sudo",
                    Arguments = $"systemctl {action} {serviceName}",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process == null)
                {
                    return Ok(new { success = false, message = "Failed to execute command" });
                }

                await process.WaitForExitAsync();
                var error = await process.StandardError.ReadToEndAsync();

                if (process.ExitCode == 0)
                {
                    return Ok(new { success = true, message = $"{serviceName} {action} completed" });
                }
                else
                {
                    return Ok(new { success = false, message = error });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Service action failed");
                return Ok(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get service logs
        /// </summary>
        [HttpGet("service-logs")]
        public async Task<IActionResult> GetServiceLogs([FromQuery] string service)
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "journalctl",
                    Arguments = $"-u {service} -n 100 --no-pager",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process == null)
                {
                    return Content("Failed to get logs", "text/plain");
                }

                var output = await process.StandardOutput.ReadToEndAsync();
                await process.WaitForExitAsync();

                return Content(output, "text/plain");
            }
            catch (Exception ex)
            {
                return Content($"Error: {ex.Message}", "text/plain");
            }
        }

        /// <summary>
        /// Run the Pi setup script
        /// </summary>
        [HttpPost("setup")]
        public async Task<IActionResult> RunSetup()
        {
            try
            {
                var scriptPath = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                    "MyDarts",
                    "scripts",
                    "setup-pi.sh"
                );

                if (!System.IO.File.Exists(scriptPath))
                {
                    return Ok(new { success = false, message = "Setup script not found at " + scriptPath });
                }

                var startInfo = new ProcessStartInfo
                {
                    FileName = "/bin/bash",
                    Arguments = scriptPath,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WorkingDirectory = Path.GetDirectoryName(scriptPath)
                };

                using var process = Process.Start(startInfo);
                if (process == null)
                {
                    return Ok(new { success = false, message = "Failed to start setup script" });
                }

                await process.WaitForExitAsync();
                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();

                _logger.LogInformation("Setup script output: {Output}", output);
                if (!string.IsNullOrEmpty(error))
                {
                    _logger.LogWarning("Setup script errors: {Error}", error);
                }

                if (process.ExitCode == 0)
                {
                    return Ok(new { success = true, message = "Setup completed successfully", output });
                }
                else
                {
                    return Ok(new { success = false, message = $"Setup failed with exit code {process.ExitCode}: {error}" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Setup script execution failed");
                return Ok(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get overall system health status
        /// </summary>
        [HttpGet("health")]
        public async Task<IActionResult> GetHealthStatus()
        {
            try
            {
                // Check database
                bool databaseHealthy = false;
                try
                {
                    var dbPath = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                        "mydarts",
                        "mydarts.db"
                    );
                    databaseHealthy = System.IO.File.Exists(dbPath);
                }
                catch { }

                // Check Autodarts config
                bool autodartsConfigured = false;
                try
                {
                    var autodartsConfigPath = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                        ".config",
                        "autodarts",
                        "config.toml"
                    );
                    if (System.IO.File.Exists(autodartsConfigPath))
                    {
                        var content = await System.IO.File.ReadAllTextAsync(autodartsConfigPath);
                        autodartsConfigured = content.Contains("board_id = '") && content.Contains("api_key = '");
                    }
                }
                catch { }

                // Check Spotify config
                bool spotifyConfigured = false;
                bool spotifyAuthenticated = false;
                try
                {
                    var spotifyConfigPath = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                        ".config",
                        "mydarts",
                        "spotify.json"
                    );
                    if (System.IO.File.Exists(spotifyConfigPath))
                    {
                        var content = await System.IO.File.ReadAllTextAsync(spotifyConfigPath);
                        spotifyConfigured = content.Contains("ClientId") && content.Length > 50;
                    }

                    // Check if Spotify is authenticated (has tokens)
                    var spotifyTokensPath = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                        ".config",
                        "mydarts",
                        "spotify_tokens.json"
                    );
                    spotifyAuthenticated = System.IO.File.Exists(spotifyTokensPath);
                }
                catch { }

                // Check darts-caller connection
                bool dartsCallerConnected = false;
                try
                {
                    using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
                    var response = await httpClient.GetAsync("http://localhost:8079");
                    dartsCallerConnected = response.IsSuccessStatusCode;
                }
                catch { }

                var health = new
                {
                    database = databaseHealthy,
                    autodartsConfigured,
                    autodartsConnected = IsServiceRunning("autodarts"),
                    spotifyConfigured,
                    spotifyAuthenticated,
                    dartsCallerConnected,
                    servicesRunning = new
                    {
                        mydarts = true, // If this endpoint is responding, mydarts is running
                        autodarts = IsServiceRunning("autodarts"),
                        dartsCaller = IsServiceRunning("darts-caller")
                    }
                };

                return Ok(health);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed");
                return Ok(new
                {
                    database = false,
                    autodartsConfigured = false,
                    autodartsConnected = false,
                    spotifyConfigured = false,
                    spotifyAuthenticated = false,
                    dartsCallerConnected = false,
                    servicesRunning = new
                    {
                        mydarts = true,
                        autodarts = false,
                        dartsCaller = false
                    }
                });
            }
        }

        private bool IsServiceRunning(string serviceName)
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "systemctl",
                    Arguments = $"is-active {serviceName}",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process == null) return false;

                var output = process.StandardOutput.ReadToEnd().Trim();
                process.WaitForExit();

                return output == "active";
            }
            catch
            {
                return false;
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

        /// <summary>
        /// Update app from git and restart
        /// </summary>
        [HttpPost("update")]
        public async Task<IActionResult> Update()
        {
            var projectDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", ".."));

            if (!IsLinux)
            {
                return Ok(new { success = false, message = "Update only available on Pi", projectDir });
            }

            try
            {
                // Git pull
                _logger.LogInformation("Pulling latest from git...");
                var (pullSuccess, pullOutput, pullError) = RunCommand("git", $"-C {projectDir} pull", 30000);
                if (!pullSuccess)
                {
                    return Ok(new { success = false, stage = "git pull", message = pullError, output = pullOutput });
                }

                // Build
                _logger.LogInformation("Building...");
                var (buildSuccess, buildOutput, buildError) = RunCommand("dotnet", $"build {projectDir} --configuration Release", 120000);
                if (!buildSuccess)
                {
                    return Ok(new { success = false, stage = "build", message = buildError, output = buildOutput });
                }

                // Schedule restart (give time for response to be sent)
                _ = Task.Run(async () =>
                {
                    await Task.Delay(1000);
                    RunCommand("sudo", "systemctl restart mydarts");
                });

                return Ok(new { success = true, message = "Update complete. Restarting...", pullOutput, buildOutput });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Update failed");
                return Ok(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get current app version (git info)
        /// </summary>
        [HttpGet("version")]
        public IActionResult GetVersion()
        {
            var projectDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", ".."));

            var (commitSuccess, commitHash, _) = RunCommand("git", $"-C {projectDir} rev-parse --short HEAD", 5000);
            var (dateSuccess, commitDate, _) = RunCommand("git", $"-C {projectDir} log -1 --format=%ci", 5000);
            var (branchSuccess, branch, _) = RunCommand("git", $"-C {projectDir} branch --show-current", 5000);

            return Ok(new
            {
                commit = commitSuccess ? commitHash.Trim() : "unknown",
                date = dateSuccess ? commitDate.Trim() : "unknown",
                branch = branchSuccess ? branch.Trim() : "unknown",
                projectDir
            });
        }
    }
}