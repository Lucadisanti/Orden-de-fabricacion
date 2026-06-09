from utils.db_helpers import responder_lista


def resumen_dashboard():
    return responder_lista("sp_dashboard_resumen")
