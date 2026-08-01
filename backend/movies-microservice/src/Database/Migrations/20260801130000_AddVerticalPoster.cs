using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Movies.Database.Migrations;

[DbContext(typeof(MoviesDbContext))]
[Migration("20260801130000_AddVerticalPoster")]
public partial class AddVerticalPoster : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "VerticalPosterBase64",
            table: "Movies",
            type: "nvarchar(max)",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "VerticalPosterBase64", table: "Movies");
    }
}
