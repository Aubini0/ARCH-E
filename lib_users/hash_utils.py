import hashlib
import os

def hash_password(password):
    # Convert password and salt to bytes
    password = password.encode('utf-8')
    salt = os.getenv('HASHING_SALT').encode('utf-8')  # Replace with your actual salt value
    
    # Perform PBKDF2 hashing
    dk = hashlib.pbkdf2_hmac('sha512', password, salt, 1000, 64)
    
    # Convert the derived key to hexadecimal format
    hashed_password = dk.hex()
    
    return hashed_password
