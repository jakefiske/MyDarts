using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.Json;

namespace MyDarts.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BluetoothController : ControllerBase
    {
        private readonly ILogger<BluetoothController> _logger;
        private static readonly string DataDir = Path.Combine(AppContext.BaseDirectory, "data");
        private static readonly string PreferredDeviceFile = Path.Combine(DataDir, "preferred_bluetooth_device.json");

        public BluetoothController(ILogger<BluetoothController> logger)
        {
            _logger = logger;
            Directory.CreateDirectory(DataDir);
        }

        private bool IsLinux => RuntimeInformation.IsOSPlatform(OSPlatform.Linux);

        private (bool success, string output, string error) RunCommand(string command, string args, int timeoutMs = 10000)
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
        /// Get Bluetooth adapter status
        /// </summary>
        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            if (!IsLinux)
            {
                return Ok(new
                {
                    serviceActive = false,
                    poweredOn = false,
                    status = "not_linux"
                });
            }

            var (serviceActive, _, _) = RunCommand("systemctl", "is-active bluetooth");
            var (showSuccess, showOutput, _) = RunCommand("bluetoothctl", "show");
            var poweredOn = showSuccess && showOutput.Contains("Powered: yes");

            return Ok(new
            {
                serviceActive,
                poweredOn,
                status = serviceActive && poweredOn ? "ready" : "not_ready"
            });
        }

        /// <summary>
        /// Scan for Bluetooth devices
        /// </summary>
        [HttpPost("scan")]
        public async Task<IActionResult> Scan()
        {
            if (!IsLinux)
            {
                return Ok(new { success = false, message = "Not running on Linux" });
            }

            // Start scan for 10 seconds
            _ = Task.Run(() => RunCommand("bluetoothctl", "scan on", 12000));
            await Task.Delay(10000);
            RunCommand("bluetoothctl", "scan off", 2000);

            return Ok(new { success = true, message = "Scan complete" });
        }

        /// <summary>
        /// List paired and available Bluetooth devices
        /// </summary>
        [HttpGet("devices")]
        public IActionResult GetDevices()
        {
            if (!IsLinux)
            {
                return Ok(new
                {
                    devices = new[]
                    {
                        new { mac = "AA:BB:CC:DD:EE:FF", name = "Test Speaker", paired = true, connected = false, trusted = true },
                        new { mac = "11:22:33:44:55:66", name = "Test Headphones", paired = false, connected = false, trusted = false }
                    }
                });
            }

            var devices = new List<object>();

            // Get paired devices
            var (pairedSuccess, pairedOutput, _) = RunCommand("bluetoothctl", "paired-devices");
            if (pairedSuccess)
            {
                foreach (var line in pairedOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries))
                {
                    // Format: "Device AA:BB:CC:DD:EE:FF Device Name"
                    if (line.StartsWith("Device "))
                    {
                        var parts = line.Substring(7).Split(' ', 2);
                        if (parts.Length >= 1)
                        {
                            var mac = parts[0];
                            var name = parts.Length > 1 ? parts[1] : "Unknown";

                            // Check if connected
                            var (infoSuccess, infoOutput, _) = RunCommand("bluetoothctl", $"info {mac}");
                            var connected = infoSuccess && infoOutput.Contains("Connected: yes");
                            var trusted = infoSuccess && infoOutput.Contains("Trusted: yes");

                            devices.Add(new
                            {
                                mac,
                                name,
                                paired = true,
                                connected,
                                trusted
                            });
                        }
                    }
                }
            }

            // Get available (scanned) devices
            var (devicesSuccess, devicesOutput, _) = RunCommand("bluetoothctl", "devices");
            if (devicesSuccess)
            {
                foreach (var line in devicesOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries))
                {
                    if (line.StartsWith("Device "))
                    {
                        var parts = line.Substring(7).Split(' ', 2);
                        if (parts.Length >= 1)
                        {
                            var mac = parts[0];
                            // Skip if already in list
                            if (devices.Any(d => ((dynamic)d).mac == mac))
                                continue;

                            var name = parts.Length > 1 ? parts[1] : "Unknown";
                            devices.Add(new
                            {
                                mac,
                                name,
                                paired = false,
                                connected = false,
                                trusted = false
                            });
                        }
                    }
                }
            }

            return Ok(new { devices });
        }

        /// <summary>
        /// Connect to a Bluetooth device
        /// </summary>
        [HttpPost("connect")]
        public IActionResult Connect([FromBody] BluetoothDeviceRequest request)
        {
            if (string.IsNullOrEmpty(request?.Mac))
            {
                return BadRequest(new { success = false, message = "MAC address required" });
            }

            if (!IsLinux)
            {
                return Ok(new { success = true, message = $"Simulated connect to {request.Name}" });
            }

            // Trust the device first
            RunCommand("bluetoothctl", $"trust {request.Mac}", 5000);

            // Try to pair if not paired
            RunCommand("bluetoothctl", $"pair {request.Mac}", 10000);

            // Connect
            var (success, output, error) = RunCommand("bluetoothctl", $"connect {request.Mac}", 15000);

            return Ok(new
            {
                success,
                message = success ? $"Connected to {request.Name}" : $"Failed to connect: {error}"
            });
        }

        /// <summary>
        /// Disconnect from a Bluetooth device
        /// </summary>
        [HttpPost("disconnect")]
        public IActionResult Disconnect([FromBody] BluetoothDeviceRequest request)
        {
            if (string.IsNullOrEmpty(request?.Mac))
            {
                return BadRequest(new { success = false, message = "MAC address required" });
            }

            if (!IsLinux)
            {
                return Ok(new { success = true, message = $"Simulated disconnect from {request.Name}" });
            }

            var (success, _, error) = RunCommand("bluetoothctl", $"disconnect {request.Mac}", 5000);

            return Ok(new
            {
                success,
                message = success ? $"Disconnected from {request.Name}" : $"Failed: {error}"
            });
        }

        /// <summary>
        /// Unpair a Bluetooth device
        /// </summary>
        [HttpPost("unpair")]
        public IActionResult Unpair([FromBody] BluetoothDeviceRequest request)
        {
            if (string.IsNullOrEmpty(request?.Mac))
            {
                return BadRequest(new { success = false, message = "MAC address required" });
            }

            if (!IsLinux)
            {
                return Ok(new { success = true, message = $"Simulated unpair {request.Name}" });
            }

            var (success, _, error) = RunCommand("bluetoothctl", $"remove {request.Mac}", 5000);

            return Ok(new
            {
                success,
                message = success ? $"Unpaired {request.Name}" : $"Failed: {error}"
            });
        }

        /// <summary>
        /// Get or set preferred Bluetooth device
        /// </summary>
        [HttpGet("preferred")]
        public IActionResult GetPreferred()
        {
            if (System.IO.File.Exists(PreferredDeviceFile))
            {
                try
                {
                    var json = System.IO.File.ReadAllText(PreferredDeviceFile);
                    var data = JsonSerializer.Deserialize<BluetoothDeviceRequest>(json);
                    return Ok(data);
                }
                catch { }
            }
            return Ok(new { mac = (string?)null, name = (string?)null });
        }

        [HttpPost("preferred")]
        public IActionResult SetPreferred([FromBody] BluetoothDeviceRequest request)
        {
            try
            {
                var json = JsonSerializer.Serialize(request);
                System.IO.File.WriteAllText(PreferredDeviceFile, json);
                return Ok(new { success = true, message = $"Saved {request.Name} as preferred" });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = ex.Message });
            }
        }
    }

    public class BluetoothDeviceRequest
    {
        public string? Mac { get; set; }
        public string? Name { get; set; }
    }
}