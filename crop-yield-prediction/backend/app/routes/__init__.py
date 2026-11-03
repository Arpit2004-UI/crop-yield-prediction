from . import dashboard, health, options, predictions


def register_routes(app):
    for module in (health, options, predictions, dashboard):
        app.register_blueprint(module.bp, url_prefix="/api")
