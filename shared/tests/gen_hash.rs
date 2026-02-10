#[test]
fn print_admin_hash() {
    let hash = shared::auth::hash_password("admin123").unwrap();
    println!("\n\nADMIN_HASH={}\n\n", hash);
    // Also verify it works
    assert!(shared::auth::verify_password("admin123", &hash).unwrap());
}
