using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MyDarts.Api.Data;
using MyDarts.Api.Domain.Engines;
using MyDarts.Api.Hubs;
using MyDarts.Api.Services;
using MyDarts.Api.Services.Interfaces;
using MyDarts.Api.Services.Repositories;
using MyDarts.Api.Services.ThrowSources;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// SignalR
builder.Services.AddSignalR();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=mydarts.db"));

// Game Engines - register all engines
builder.Services.AddSingleton<IGameEngine, AroundTheClockTurboEngine>();
builder.Services.AddSingleton<IGameEngine, X01Engine>();
builder.Services.AddSingleton<IGameEngine, CricketEngine>();
builder.Services.AddSingleton<IGameEngine, MickeyMouseEngine>();

// Core Services
builder.Services.AddSingleton<IGameEngineFactory, GameEngineFactory>();
builder.Services.AddSingleton<IGameSessionManager, InMemoryGameSessionManager>();
builder.Services.AddSingleton<ISignalRBroadcaster, SignalRBroadcaster>();
builder.Services.AddSingleton<IEventDispatcher, EventDispatcher>();
builder.Services.AddSingleton<IDartsCallerService, DartsCallerService>();
builder.Services.AddScoped<IGameService, GameService>();
builder.Services.AddScoped<IGameRepository, SqliteGameRepository>();

// Throw Sources - pluggable dart detection
builder.Services.AddSingleton<AutodartsThrowSource>();
builder.Services.AddSingleton<OpenCVThrowSource>();
builder.Services.AddSingleton<IThrowSourceManager>(sp =>
{
    var manager = new ThrowSourceManager(
        sp,
        sp.GetRequiredService<IHubContext<GameHub>>(),
        sp.GetRequiredService<ILogger<ThrowSourceManager>>());

    // Register available sources
    manager.RegisterSource(sp.GetRequiredService<AutodartsThrowSource>());
    manager.RegisterSource(sp.GetRequiredService<OpenCVThrowSource>());

    return manager;
});

// HTTP Client for Autodarts proxy
builder.Services.AddHttpClient();

// CORS - Updated to allow SignalR
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for SignalR
    });
});

var app = builder.Build();

// Ensure database created
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");

// Map SignalR hub
app.MapHub<GameHub>("/gamehub");

app.MapControllers();

app.Run();