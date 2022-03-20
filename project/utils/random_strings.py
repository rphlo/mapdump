import secrets
import string


def generate_random_string(base_string_character, string_size=10):
    """
    Common function to generate a string_size length random string based on the first parameter.
    """
    ret_str = ""
    # Select random character for string_size times.
    for i in range(string_size):
        # Random select one character from the base character string.
        character = secrets.choice(base_string_character)
        # Append the selected character to the return string.
        ret_str += character
    return ret_str


def generate_random_digit(str_len=10):
    """
    Generate random digit content string only.
    """
    return generate_random_string(string.digits, str_len)


def generate_random_alphabet(str_len=10):
    """
    Generate random alphabet content string.
    """
    return generate_random_string(string.ascii_letters, str_len)


def generate_random_alphabet_digit(str_len=10):
    """
    Generate random alphabet and digits content string.
    """
    return generate_random_string(string.digits + string.ascii_letters, str_len)
