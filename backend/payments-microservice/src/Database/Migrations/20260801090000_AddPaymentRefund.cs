using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Payments.Database;

#nullable disable

namespace Payments.Database.Migrations;

[DbContext(typeof(PaymentsDbContext))]
[Migration("20260801090000_AddPaymentRefund")]
public partial class AddPaymentRefund : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "RefundedAtUtc",
            table: "Payments",
            type: "datetime2",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "RefundedAtUtc", table: "Payments");
    }
}
