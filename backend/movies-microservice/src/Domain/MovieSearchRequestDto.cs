namespace Movies.Domain;

public sealed class MovieSearchRequestDto
{
    public string? Search { get; init; }
    public DateOnly? PremiereDate { get; init; }
    public MovieStatus? Status { get; init; }
    public bool IncludeImages { get; init; } = true;
}
