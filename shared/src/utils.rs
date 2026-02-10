/// Convert a title into a URL-friendly slug.
///
/// Lowercases the input, replaces non-alphanumeric characters with spaces,
/// deduplicates whitespace, and joins with hyphens.
pub fn slugify(title: &str) -> String {
    title
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() || c == ' ' { c } else { ' ' })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<&str>>()
        .join("-")
}
