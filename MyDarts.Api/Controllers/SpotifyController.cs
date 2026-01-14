using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MyDarts.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SpotifyController : ControllerBase
    {
        private readonly ILogger<SpotifyController> _logger;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;

        private static readonly string DataDir = Path.Combine(AppContext.BaseDirectory, "data");
        private static readonly string TokensFile = Path.Combine(DataDir, "spotify_tokens.json");
        private static readonly string PreferredDeviceFile = Path.Combine(DataDir, "spotify_preferred_device.json");

        // Static token storage (in production, use a proper cache/store)
        private static SpotifyTokens? _tokens;
        private static readonly object _tokenLock = new();

        public SpotifyController(
            ILogger<SpotifyController> logger,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
            Directory.CreateDirectory(DataDir);

            // Load tokens on first access
            if (_tokens == null)
            {
                LoadTokens();
            }
        }

        private string ClientId => _configuration["Spotify:ClientId"] ?? "";
        private string ClientSecret => _configuration["Spotify:ClientSecret"] ?? "";
        private string RedirectUri => _configuration["Spotify:RedirectUri"] ?? "http://localhost:5025/api/spotify/callback";

        private void LoadTokens()
        {
            lock (_tokenLock)
            {
                if (System.IO.File.Exists(TokensFile))
                {
                    try
                    {
                        var json = System.IO.File.ReadAllText(TokensFile);
                        _tokens = JsonSerializer.Deserialize<SpotifyTokens>(json);
                        _logger.LogInformation("Loaded Spotify tokens from disk");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to load Spotify tokens");
                    }
                }
            }
        }

        private void SaveTokens()
        {
            lock (_tokenLock)
            {
                if (_tokens != null)
                {
                    try
                    {
                        var json = JsonSerializer.Serialize(_tokens);
                        System.IO.File.WriteAllText(TokensFile, json);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to save Spotify tokens");
                    }
                }
            }
        }

        private async Task<bool> EnsureValidToken()
        {
            if (_tokens == null || string.IsNullOrEmpty(_tokens.RefreshToken))
                return false;

            if (_tokens.ExpiresAt > DateTime.UtcNow.AddMinutes(5))
                return true;

            // Refresh the token
            try
            {
                var client = _httpClientFactory.CreateClient();
                var authHeader = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{ClientId}:{ClientSecret}"));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

                var content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("grant_type", "refresh_token"),
                    new KeyValuePair<string, string>("refresh_token", _tokens.RefreshToken)
                });

                var response = await client.PostAsync("https://accounts.spotify.com/api/token", content);
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var tokenResponse = JsonSerializer.Deserialize<SpotifyTokenResponse>(json);

                    if (tokenResponse != null)
                    {
                        _tokens.AccessToken = tokenResponse.AccessToken;
                        _tokens.ExpiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn - 60);
                        if (!string.IsNullOrEmpty(tokenResponse.RefreshToken))
                            _tokens.RefreshToken = tokenResponse.RefreshToken;

                        SaveTokens();
                        return true;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to refresh Spotify token");
            }

            return false;
        }

        /// <summary>
        /// Get Spotify authentication status
        /// </summary>
        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            var configured = !string.IsNullOrEmpty(ClientId) && !string.IsNullOrEmpty(ClientSecret);
            var authenticated = _tokens != null && !string.IsNullOrEmpty(_tokens.AccessToken);

            return Ok(new
            {
                configured,
                authenticated,
                hasTokens = _tokens != null && !string.IsNullOrEmpty(_tokens.RefreshToken)
            });
        }

        /// <summary>
        /// Get Spotify login URL
        /// </summary>
        [HttpGet("login")]
        public IActionResult Login()
        {
            if (string.IsNullOrEmpty(ClientId))
            {
                return BadRequest(new { error = "Spotify not configured" });
            }

            var scopes = "user-read-playback-state user-modify-playback-state user-read-currently-playing";
            var authUrl = $"https://accounts.spotify.com/authorize?client_id={ClientId}&response_type=code&redirect_uri={Uri.EscapeDataString(RedirectUri)}&scope={Uri.EscapeDataString(scopes)}";

            return Ok(new { authUrl });
        }

        /// <summary>
        /// Handle Spotify OAuth callback
        /// </summary>
        [HttpGet("callback")]
        public async Task<IActionResult> Callback([FromQuery] string code)
        {
            if (string.IsNullOrEmpty(code))
            {
                return BadRequest("No authorization code");
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                var authHeader = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{ClientId}:{ClientSecret}"));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

                var content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("grant_type", "authorization_code"),
                    new KeyValuePair<string, string>("code", code),
                    new KeyValuePair<string, string>("redirect_uri", RedirectUri)
                });

                var response = await client.PostAsync("https://accounts.spotify.com/api/token", content);
                var json = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var tokenResponse = JsonSerializer.Deserialize<SpotifyTokenResponse>(json);
                    if (tokenResponse != null)
                    {
                        _tokens = new SpotifyTokens
                        {
                            AccessToken = tokenResponse.AccessToken,
                            RefreshToken = tokenResponse.RefreshToken,
                            ExpiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn - 60)
                        };
                        SaveTokens();

                        // Redirect to frontend
                        return Redirect("/settings?spotify=success");
                    }
                }

                return BadRequest(new { error = "Token exchange failed", details = json });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Spotify callback failed");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Logout from Spotify
        /// </summary>
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            _tokens = null;
            if (System.IO.File.Exists(TokensFile))
                System.IO.File.Delete(TokensFile);

            return Ok(new { success = true, message = "Logged out" });
        }

        /// <summary>
        /// Get current playback state
        /// </summary>
        [HttpGet("playback")]
        public async Task<IActionResult> GetPlayback()
        {
            if (!await EnsureValidToken())
                return Unauthorized(new { error = "Not authenticated" });

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _tokens!.AccessToken);

                var response = await client.GetAsync("https://api.spotify.com/v1/me/player");

                if (response.StatusCode == System.Net.HttpStatusCode.NoContent)
                    return Ok(new { isPlaying = false });

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var playback = JsonSerializer.Deserialize<JsonElement>(json);
                    return Ok(playback);
                }

                return Ok(new { isPlaying = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get playback");
                return Ok(new { isPlaying = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Play/resume playback
        /// </summary>
        [HttpPost("play")]
        public async Task<IActionResult> Play()
        {
            if (!await EnsureValidToken())
                return Unauthorized(new { error = "Not authenticated" });

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _tokens!.AccessToken);

                var response = await client.PutAsync("https://api.spotify.com/v1/me/player/play", null);
                return Ok(new { success = response.IsSuccessStatusCode });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Pause playback
        /// </summary>
        [HttpPost("pause")]
        public async Task<IActionResult> Pause()
        {
            if (!await EnsureValidToken())
                return Unauthorized(new { error = "Not authenticated" });

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _tokens!.AccessToken);

                var response = await client.PutAsync("https://api.spotify.com/v1/me/player/pause", null);
                return Ok(new { success = response.IsSuccessStatusCode });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Skip to next track
        /// </summary>
        [HttpPost("next")]
        public async Task<IActionResult> Next()
        {
            if (!await EnsureValidToken())
                return Unauthorized(new { error = "Not authenticated" });

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _tokens!.AccessToken);

                var response = await client.PostAsync("https://api.spotify.com/v1/me/player/next", null);
                return Ok(new { success = response.IsSuccessStatusCode });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Skip to previous track
        /// </summary>
        [HttpPost("previous")]
        public async Task<IActionResult> Previous()
        {
            if (!await EnsureValidToken())
                return Unauthorized(new { error = "Not authenticated" });

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _tokens!.AccessToken);

                var response = await client.PostAsync("https://api.spotify.com/v1/me/player/previous", null);
                return Ok(new { success = response.IsSuccessStatusCode });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Get available devices
        /// </summary>
        [HttpGet("devices")]
        public async Task<IActionResult> GetDevices()
        {
            if (!await EnsureValidToken())
                return Unauthorized(new { error = "Not authenticated" });

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _tokens!.AccessToken);

                var response = await client.GetAsync("https://api.spotify.com/v1/me/player/devices");
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var devices = JsonSerializer.Deserialize<JsonElement>(json);
                    return Ok(devices);
                }

                return Ok(new { devices = Array.Empty<object>() });
            }
            catch (Exception ex)
            {
                return Ok(new { devices = Array.Empty<object>(), error = ex.Message });
            }
        }

        /// <summary>
        /// Transfer playback to a device
        /// </summary>
        [HttpPost("transfer")]
        public async Task<IActionResult> Transfer([FromBody] TransferRequest request)
        {
            if (!await EnsureValidToken())
                return Unauthorized(new { error = "Not authenticated" });

            if (string.IsNullOrEmpty(request?.DeviceId))
                return BadRequest(new { error = "Device ID required" });

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _tokens!.AccessToken);

                var content = new StringContent(
                    JsonSerializer.Serialize(new { device_ids = new[] { request.DeviceId } }),
                    Encoding.UTF8,
                    "application/json");

                var response = await client.PutAsync("https://api.spotify.com/v1/me/player", content);
                return Ok(new { success = response.IsSuccessStatusCode });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Get/set preferred device
        /// </summary>
        [HttpGet("preferred-device")]
        public IActionResult GetPreferredDevice()
        {
            if (System.IO.File.Exists(PreferredDeviceFile))
            {
                try
                {
                    var json = System.IO.File.ReadAllText(PreferredDeviceFile);
                    return Ok(JsonSerializer.Deserialize<JsonElement>(json));
                }
                catch { }
            }
            return Ok(new { deviceId = (string?)null, deviceName = (string?)null });
        }

        [HttpPost("preferred-device")]
        public IActionResult SetPreferredDevice([FromBody] PreferredDeviceRequest request)
        {
            try
            {
                var json = JsonSerializer.Serialize(request);
                System.IO.File.WriteAllText(PreferredDeviceFile, json);
                return Ok(new { success = true, message = $"Saved {request.DeviceName} as preferred" });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = ex.Message });
            }
        }
    }

    public class SpotifyTokens
    {
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    public class SpotifyTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = "";

        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; set; }

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }
    }

    public class TransferRequest
    {
        public string? DeviceId { get; set; }
    }

    public class PreferredDeviceRequest
    {
        public string? DeviceId { get; set; }
        public string? DeviceName { get; set; }
    }
}