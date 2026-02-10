use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::UserRole;

/// JWT claims embedded in every access token.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    /// Subject -- the user's UUID as a string.
    pub sub: String,
    /// User e-mail address.
    pub email: String,
    /// User role (admin / agent / user).
    pub role: String,
    /// Expiration timestamp (seconds since UNIX epoch).
    pub exp: usize,
}

/// Create a signed JWT that expires in 24 hours.
pub fn create_token(
    user_id: Uuid,
    email: &str,
    role: &UserRole,
    secret: &str,
) -> Result<String, AppError> {
    let expiration = Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_owned(),
        role: serde_json::to_value(role)
            .ok()
            .and_then(|v| v.as_str().map(String::from))
            .unwrap_or_else(|| format!("{:?}", role)),
        exp: expiration,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(format!("Failed to create token: {e}")))
}

/// Verify a JWT and return the embedded claims.
pub fn verify_token(token: &str, secret: &str) -> Result<Claims, AppError> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|e| AppError::Unauthorized(format!("Invalid token: {e}")))?;

    Ok(token_data.claims)
}

/// Hash a plaintext password using Argon2id.
pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| AppError::Internal(format!("Failed to hash password: {e}")))
}

/// Verify a plaintext password against an Argon2 hash.
pub fn verify_password(password: &str, hash: &str) -> Result<bool, AppError> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| AppError::Internal(format!("Invalid password hash: {e}")))?;

    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hash_and_verify() {
        let password = "supersecret123";
        let hash = hash_password(password).unwrap();
        assert!(verify_password(password, &hash).unwrap());
        assert!(!verify_password("wrong", &hash).unwrap());
    }

    #[test]
    fn test_token_roundtrip() {
        let secret = "test-jwt-secret-key";
        let user_id = Uuid::new_v4();
        let email = "test@example.com";
        let role = UserRole::Agent;

        let token = create_token(user_id, email, &role, secret).unwrap();
        let claims = verify_token(&token, secret).unwrap();

        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.email, email);
    }

    #[test]
    fn test_invalid_token() {
        let result = verify_token("invalid.token.here", "secret");
        assert!(result.is_err());
    }
}
