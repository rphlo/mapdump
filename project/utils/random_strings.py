import string
import random
import uuid


def generate_random_string(base_string_character, string_size=10):
    """
    Common function to generate a string_size length random string based on the first parameter.
    """
    ret_str = ''
    # Select random character for string_size times.
    for i in range(string_size):
        # Random select one character from the base character string.
        character = random.choice(base_string_character)
        # Append the selected character to the return string.
        ret_str += character
    return ret_str


def generate_random_digit(str_len=10):
    """
    Generate random digit content string only.
    """
    ret = generate_random_string(string.digits, str_len)
    return ret


def generate_random_alphabet(str_len=10):
    """
    Generate random alphabet content string.
    """
    ret = generate_random_string(string.ascii_letters, str_len)
    return ret


def generate_random_alphabet_digit(str_len=10):
    """
    Generate random alphabet and digits content string.
    """
    ret = generate_random_string(string.digits + string.ascii_letters, str_len)
    return ret


def generate_random_alphabet_digit_with_special_number(digit_number=5,
                                                       alphabet_number=5):
    """
    Generate random string with specified digit count and alphabet character count.
    """
    # Generate specified length digit string.
    digit_str = generate_random_digit(digit_number)
    # Generate specified length alphabet string.
    alphabet_str = generate_random_alphabet(alphabet_number)
    # Add above two random string.
    tmp_str = digit_str + alphabet_str
    # Convert above string to list.
    tmp_str_list = list(tmp_str)
    tmp_str_len = len(tmp_str)
    # Scatter characters order in the string list and return a new ordered string list.
    ret = random.sample(tmp_str_list, tmp_str_len)
    # Convert string list back to a string.
    ret = str(ret)
    ret = ret.strip('[').strip(']')
    ret = ret.replace(",", "").replace("'", "").replace(" ", "")
    return ret


def generate_random_uuid():
    """
    Use python uuid module to generate a uuid.
    """
    # Create uuid.
    ret = uuid.uuid1()
    # Convert uuid to string.
    ret = str(ret)
    return ret
