using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Movies.Database.Migrations;

[DbContext(typeof(MoviesDbContext))]
[Migration("20260802090000_AddMovieTrailerUrl")]
public partial class AddMovieTrailerUrl : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) =>
        migrationBuilder.AddColumn<string>(
            name: "TrailerUrl",
            table: "Movies",
            type: "nvarchar(500)",
            maxLength: 500,
            nullable: true
        );

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropColumn(name: "TrailerUrl", table: "Movies");
}
