using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuthMicroservice.Database.Migrations;

[DbContext(typeof(AuthDbContext))]
[Migration("20260804170000_AddPasswordResetTokens")]
public sealed class AddPasswordResetTokens : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "PasswordResetTokenExpiresAtUtc",
            table: "Users",
            type: "datetime2",
            nullable: true
        );
        migrationBuilder.AddColumn<string>(
            name: "PasswordResetTokenHash",
            table: "Users",
            type: "nvarchar(64)",
            maxLength: 64,
            nullable: true
        );
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "PasswordResetTokenExpiresAtUtc", table: "Users");
        migrationBuilder.DropColumn(name: "PasswordResetTokenHash", table: "Users");
    }
}
