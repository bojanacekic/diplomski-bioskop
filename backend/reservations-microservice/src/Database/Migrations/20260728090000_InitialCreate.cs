using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Reservations.Database.Migrations;

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Reservations",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ScreeningId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                SeatLabel = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                ReservedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                CancelledAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Reservations", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Reservations_UserId_ReservedAtUtc",
            table: "Reservations",
            columns: new[] { "UserId", "ReservedAtUtc" });

        migrationBuilder.CreateIndex(
            name: "IX_Reservations_ScreeningId_SeatLabel",
            table: "Reservations",
            columns: new[] { "ScreeningId", "SeatLabel" },
            unique: true,
            filter: "[Status] = 'Active'");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "Reservations");
    }
}
