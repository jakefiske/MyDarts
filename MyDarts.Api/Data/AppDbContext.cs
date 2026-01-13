using Microsoft.EntityFrameworkCore;
using MyDarts.Api.Models.Entities;

namespace MyDarts.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<GameRecord> Games { get; set; }
        public DbSet<PlayerRecord> PlayerRecords { get; set; }
        public DbSet<SavedPlayer> SavedPlayers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<GameRecord>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.GameId).IsUnique();
                entity.HasMany(e => e.Players)
                    .WithOne(p => p.GameRecord)
                    .HasForeignKey(p => p.GameRecordId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<PlayerRecord>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.PlayerName);
            });

            // Configure SavedPlayer
            modelBuilder.Entity<SavedPlayer>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired();
            });
        }
    }
}