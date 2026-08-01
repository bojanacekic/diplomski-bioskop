using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
namespace RatingsRecommendations.Database.Migrations;
[DbContext(typeof(RatingsRecommendationsDbContext))]
[Migration("20260801120000_InitialCreate")]
public partial class InitialCreate : Migration
{
 protected override void Up(MigrationBuilder migrationBuilder) { migrationBuilder.CreateTable(name: "MovieRatings", columns: table => new { Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false), UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false), MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false), Score = table.Column<int>(type: "int", nullable: false), CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false), UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false) }, constraints: table => table.PrimaryKey("PK_MovieRatings", x => x.Id)); migrationBuilder.CreateIndex(name: "IX_MovieRatings_MovieId", table: "MovieRatings", column: "MovieId"); migrationBuilder.CreateIndex(name: "IX_MovieRatings_UserId_MovieId", table: "MovieRatings", columns: new[] { "UserId", "MovieId" }, unique: true); }
 protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable(name: "MovieRatings");
}
