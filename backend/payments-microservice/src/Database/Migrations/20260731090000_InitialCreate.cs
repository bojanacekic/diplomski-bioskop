using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Payments.Database.Migrations;

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Payments",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ReservationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Amount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                CardLastFour = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: false),
                Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                FailureReason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                CapturedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                VoidedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
            },
            constraints: table => table.PrimaryKey("PK_Payments", x => x.Id));

        migrationBuilder.CreateIndex(
            name: "IX_Payments_ReservationId",
            table: "Payments",
            column: "ReservationId");
        migrationBuilder.CreateIndex(
            name: "IX_Payments_UserId_CreatedAtUtc",
            table: "Payments",
            columns: new[] { "UserId", "CreatedAtUtc" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "Payments");
    }
}
