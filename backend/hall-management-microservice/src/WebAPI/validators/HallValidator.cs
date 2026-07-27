using Halls.Domain;

namespace Halls.WebAPI.Validators;

public static class HallValidator
{
    public static Dictionary<string, string[]> Validate(CreateHallRequestDto request) =>
        Validate(request.Name, request.Rows, request.SeatsPerRow);

    public static Dictionary<string, string[]> Validate(UpdateHallRequestDto request) =>
        Validate(request.Name, request.Rows, request.SeatsPerRow);

    private static Dictionary<string, string[]> Validate(string name, int rows, int seatsPerRow)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(name))
            errors["name"] = ["Name is required."];
        if (rows < 1 || rows > 30)
            errors["rows"] = ["Rows must be between 1 and 30."];
        if (seatsPerRow < 1 || seatsPerRow > 50)
            errors["seatsPerRow"] = ["Seats per row must be between 1 and 50."];
        return errors;
    }
}
