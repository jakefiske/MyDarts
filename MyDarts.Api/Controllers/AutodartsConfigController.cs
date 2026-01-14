using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace MyDarts.Api.Controllers;

[ApiController]
[Route("api/autodarts")]
public class AutodartsConfigController : ControllerBase
{
    private readonly ILogger<AutodartsConfigController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _configPath;

    public AutodartsConfigController(
        ILogger<AutodartsConfigController> logger,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        // Config file path: ~/.config/autodarts/config.toml
        var homeDir = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        _configPath = Path.Combine(homeDir, ".config", "autodarts", "config.toml");
    }

    [HttpGet("config")]
    public async Task<IActionResult> GetConfig()
    {
        try
        {
            if (!System.IO.File.Exists(_configPath))
            {
                return Ok(new { boardId = "", apiKey = "" });
            }

            var content = await System.IO.File.ReadAllTextAsync(_configPath);
            var boardId = ExtractValue(content, "board_id");
            var apiKey = ExtractValue(content, "api_key");

            return Ok(new { boardId, apiKey });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to read autodarts config");
            return StatusCode(500, new { error = "Failed to read configuration" });
        }
    }

    [HttpPost("config")]
    public async Task<IActionResult> SaveConfig([FromBody] AutodartsCredentialsRequest request)
    {
        try
        {
            // Ensure directory exists
            var configDir = Path.GetDirectoryName(_configPath);
            if (!Directory.Exists(configDir))
            {
                Directory.CreateDirectory(configDir!);
            }

            // Read existing config or create new
            string existingContent = "";
            if (System.IO.File.Exists(_configPath))
            {
                existingContent = await System.IO.File.ReadAllTextAsync(_configPath);
            }

            // Update or create config
            var newContent = UpdateOrCreateConfig(existingContent, request.BoardId, request.ApiKey);

            // Write to file
            await System.IO.File.WriteAllTextAsync(_configPath, newContent);

            _logger.LogInformation("Updated autodarts config at {Path}", _configPath);

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save autodarts config");
            return StatusCode(500, new { error = "Failed to save configuration" });
        }
    }

    [HttpPost("test")]
    public async Task<IActionResult> TestConnection([FromBody] AutodartsCredentialsRequest request)
    {
        try
        {
            using var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {request.ApiKey}");

            var response = await httpClient.GetAsync($"https://api.autodarts.io/bs/v0/boards/{request.BoardId}");

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var board = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(content);
                var boardName = board.TryGetProperty("name", out var name) ? name.GetString() : "Unknown";

                return Ok(new { success = true, boardName });
            }
            else
            {
                return Ok(new { success = false, message = $"API returned {response.StatusCode}" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Autodarts connection test failed");
            return Ok(new { success = false, message = ex.Message });
        }
    }

    private string ExtractValue(string content, string key)
    {
        // Simple TOML parser for board_id and api_key
        var lines = content.Split('\n');
        foreach (var line in lines)
        {
            if (line.Trim().StartsWith(key))
            {
                var parts = line.Split('=');
                if (parts.Length == 2)
                {
                    return parts[1].Trim().Trim('\'', '"', ' ');
                }
            }
        }
        return "";
    }

    private string UpdateOrCreateConfig(string existingContent, string boardId, string apiKey)
    {
        if (string.IsNullOrWhiteSpace(existingContent))
        {
            // Create new config
            return $@"[auth]
                board_id = '{boardId}'
                api_key = '{apiKey}'

                [cam]
                cams = ['/dev/video0', '/dev/video2', '/dev/video4']
                width = 1280
                height = 720
                fps = 30
                rotate_180 = []
                ";
        }

        // Update existing config
        var lines = existingContent.Split('\n').ToList();
        bool updatedBoardId = false;
        bool updatedApiKey = false;
        bool inAuthSection = false;

        for (int i = 0; i < lines.Count; i++)
        {
            var line = lines[i].Trim();

            if (line == "[auth]")
            {
                inAuthSection = true;
                continue;
            }

            if (line.StartsWith("[") && line != "[auth]")
            {
                inAuthSection = false;
            }

            if (inAuthSection)
            {
                if (line.StartsWith("board_id"))
                {
                    lines[i] = $"board_id = '{boardId}'";
                    updatedBoardId = true;
                }
                else if (line.StartsWith("api_key"))
                {
                    lines[i] = $"api_key = '{apiKey}'";
                    updatedApiKey = true;
                }
            }
        }

        // If auth section doesn't exist, add it
        if (!updatedBoardId || !updatedApiKey)
        {
            var authSection = new StringBuilder();
            authSection.AppendLine("[auth]");
            if (!updatedBoardId) authSection.AppendLine($"board_id = '{boardId}'");
            if (!updatedApiKey) authSection.AppendLine($"api_key = '{apiKey}'");

            lines.Insert(0, authSection.ToString());
        }

        return string.Join('\n', lines);
    }
}

public class AutodartsCredentialsRequest
{
    public string BoardId { get; set; } = "";
    public string ApiKey { get; set; } = "";
}