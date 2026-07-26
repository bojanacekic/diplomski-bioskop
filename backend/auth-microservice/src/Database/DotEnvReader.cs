namespace AuthMicroservice.Database;

public static class DotEnvReader
{
    public static void Load(string? startDirectory = null)
    {
        var directory = new DirectoryInfo(startDirectory ?? Directory.GetCurrentDirectory());
        var envFile = FindEnvFile(directory);
        if (envFile is null)
        {
            return;
        }

        foreach (var line in File.ReadLines(envFile.FullName))
        {
            var trimmedLine = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmedLine) || trimmedLine.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = trimmedLine.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = trimmedLine[..separatorIndex].Trim();
            var value = trimmedLine[(separatorIndex + 1)..].Trim().Trim('"');
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
            {
                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }

    private static FileInfo? FindEnvFile(DirectoryInfo? directory)
    {
        while (directory is not null)
        {
            var candidate = new FileInfo(Path.Combine(directory.FullName, ".env"));
            if (candidate.Exists)
            {
                return candidate;
            }

            directory = directory.Parent;
        }

        return null;
    }
}
