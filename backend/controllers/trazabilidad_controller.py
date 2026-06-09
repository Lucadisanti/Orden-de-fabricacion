from utils.db_helpers import responder_lista


def trazabilidad_por_lote(codigo_lote):
    return responder_lista("sp_trazabilidad_por_lote", (codigo_lote,))


def ordenes_afectadas_por_lote(id_lote):
    return responder_lista("sp_ordenes_afectadas_por_lote", (id_lote,))


def materiales_por_orden(id_orden):
    return responder_lista("sp_materiales_por_orden", (id_orden,))
