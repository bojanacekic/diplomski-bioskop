namespace Movies.Services;

public static class DotEnvReader
{
    public static void Load(string? startDirectory = null)
    {
        var directory = new DirectoryInfo(startDirectory ?? Directory.GetCurrentDirectory());
        while (directory is not null)
        {
            var envFilePath = Path.Combine(directory.FullName, ".env");
            if (File.Exists(envFilePath))
            {
                foreach (var line in File.ReadLines(envFilePath))
                {
                    var value = line.Trim();
                    if (string.IsNullOrWhiteSpace(value) || value.StartsWith('#')) continue;
                    var separator = value.IndexOf('=');
                    if (separator <= 0) continue;
                    var key = value[..separator].Trim();
                    if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
                        Environment.SetEnvironmentVariable(key, value[(separator + 1)..].Trim().Trim('"'));
                }
                return;
            }
            directory = directory.Parent;
        }
    }
}
