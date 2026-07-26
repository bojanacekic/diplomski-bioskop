namespace Movies.Domain;

public sealed class ChangeMovieStatusRequestDto
{
    public MovieStatus Status { get; init; }
}
