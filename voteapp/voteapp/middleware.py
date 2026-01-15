"""
Custom CORS middleware for handling cross-origin requests
"""

class CORSMiddleware:
    """
    Middleware to handle CORS headers for cross-origin requests.
    Allows requests from frontend development servers.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.allowed_origins = [
            "http://127.0.0.1:5173",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://localhost:3000",
            "http://127.0.0.1:8080",
            "http://localhost:8080",
        ]

    def __call__(self, request):
        # Handle preflight requests
        if request.method == "OPTIONS":
            return self.handle_preflight(request)

        response = self.get_response(request)
        
        # Add CORS headers to response
        origin = request.META.get("HTTP_ORIGIN")
        if origin in self.allowed_origins:
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            response["Access-Control-Expose-Headers"] = "Content-Type, Authorization"
            response["Access-Control-Max-Age"] = "3600"

        return response

    def handle_preflight(self, request):
        """Handle OPTIONS requests for CORS preflight"""
        from django.http import HttpResponse
        
        origin = request.META.get("HTTP_ORIGIN")
        if origin in self.allowed_origins:
            response = HttpResponse()
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            response["Access-Control-Expose-Headers"] = "Content-Type, Authorization"
            response["Access-Control-Max-Age"] = "3600"
            return response
        
        from django.http import HttpResponse
        return HttpResponse(status=403)
