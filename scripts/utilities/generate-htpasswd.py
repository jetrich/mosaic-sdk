#!/usr/bin/env python3

import crypt
import random
import string

def generate_htpasswd_hash(username, password):
    """Generate an Apache htpasswd compatible hash"""
    # Generate a random salt for APR1
    salt_chars = string.ascii_letters + string.digits + './'
    salt = ''.join(random.choice(salt_chars) for _ in range(8))
    
    # Use MD5 crypt (APR1 format)
    # Note: This requires the passlib library for proper APR1 support
    try:
        from passlib.hash import apr_md5_crypt
        hash_value = apr_md5_crypt.hash(password)
        return f"{username}:{hash_value}"
    except ImportError:
        # Fallback to basic crypt if passlib not available
        print("Warning: passlib not installed. Using basic crypt.")
        print("Install with: pip install passlib")
        # Use SHA512 as fallback
        hash_value = crypt.crypt(password, f"$6${salt}$")
        return f"{username}:{hash_value}"

if __name__ == "__main__":
    username = "testuser"
    password = "testpass123"
    
    print(f"Generating htpasswd entry for user: {username}")
    print(f"Password: {password}")
    print()
    
    htpasswd_entry = generate_htpasswd_hash(username, password)
    print("Add this line to your htpasswd file:")
    print(htpasswd_entry)
    
    print()
    print("To update the htpasswd file:")
    print(f"echo '{htpasswd_entry}' > conf/development/verdaccio/htpasswd")