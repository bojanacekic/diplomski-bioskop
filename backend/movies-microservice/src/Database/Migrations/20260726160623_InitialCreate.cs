using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Movies.Database.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Movies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(
                        type: "nvarchar(200)",
                        maxLength: 200,
                        nullable: false
                    ),
                    Description = table.Column<string>(
                        type: "nvarchar(2000)",
                        maxLength: 2000,
                        nullable: false
                    ),
                    Genre = table.Column<string>(
                        type: "nvarchar(100)",
                        maxLength: 100,
                        nullable: false
                    ),
                    DurationMinutes = table.Column<int>(type: "int", nullable: false),
                    PremiereDate = table.Column<DateOnly>(type: "date", nullable: false),
                    AgeRating = table.Column<string>(
                        type: "nvarchar(30)",
                        maxLength: 30,
                        nullable: false
                    ),
                    PosterBase64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AverageRating = table.Column<decimal>(
                        type: "decimal(3,2)",
                        precision: 3,
                        scale: 2,
                        nullable: false
                    ),
                    Status = table.Column<string>(
                        type: "nvarchar(20)",
                        maxLength: 20,
                        nullable: false
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Movies", x => x.Id);
                }
            );

            migrationBuilder.CreateIndex(name: "IX_Movies_Title", table: "Movies", column: "Title");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Movies");
        }
    }
}
