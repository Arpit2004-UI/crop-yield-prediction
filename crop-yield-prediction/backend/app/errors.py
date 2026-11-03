"""Consistent JSON envelopes.  Success: {"success": true, ...}   Error: {"success": false, "error": {...}}"""
import logging

from flask import jsonify
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import HTTPException

log = logging.getLogger(__name__)


class ApiError(Exception):
    def __init__(self, message, status=400, code="bad_request", details=None):
        super().__init__(message)
        self.message, self.status, self.code, self.details = message, status, code, details


def error_response(message, status, code, details=None):
    body = {"success": False, "error": {"code": code, "message": message}}
    if details:
        body["error"]["details"] = details
    return jsonify(body), status


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def _api(e):
        return error_response(e.message, e.status, e.code, e.details)

    @app.errorhandler(SQLAlchemyError)
    def _db(e):
        log.exception("Database error")  # full detail stays in server logs only
        return error_response("The database is unavailable or rejected the operation.", 503, "database_error")

    @app.errorhandler(HTTPException)
    def _http(e):
        return error_response(e.description, e.code or 500, (e.name or "error").lower().replace(" ", "_"))

    @app.errorhandler(Exception)
    def _unexpected(e):
        log.exception("Unexpected error")
        return error_response("Unexpected server error.", 500, "server_error")
