class BusinessLogicError(Exception):
    """Exception raised for domain logic errors."""
    def __init__(self, message: str, code: str = "BUSINESS_LOGIC_ERROR", status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(self.message)

class ExternalAPIError(Exception):
    """Exception raised for external API failures."""
    def __init__(self, message: str, original_error: Exception | None = None):
        self.message = message
        self.original_error = original_error
        super().__init__(self.message)

class ValidationError(Exception):
    """Exception raised for data validation issues."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)
