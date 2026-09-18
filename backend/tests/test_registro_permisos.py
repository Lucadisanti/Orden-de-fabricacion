from flask import Flask, jsonify, session
from datetime import datetime
from unittest.mock import MagicMock
import pytest

from utils import registro_permisos


@pytest.mark.parametrize(
    "ruta",
    [
        "/api/materiales/5",
        "/api/ordenes/5",
        "/api/planillas/5",
        "/api/planillas/detalles/9",
        "/api/produccion-diaria/linea/12",
    ],
)
def test_empleado_edita_cualquier_registro_sin_autor_previo(ruta):
    aplicacion = Flask(__name__)
    aplicacion.secret_key = "pruebas"
    with aplicacion.test_request_context(ruta, method="PUT"):
        session["usuario"] = {"id": 7, "nombre": "Ana", "rol": "empleado"}
        assert registro_permisos.autorizar_cambio() is None


def test_empleado_no_elimina():
    aplicacion = Flask(__name__)
    aplicacion.secret_key = "pruebas"
    with aplicacion.test_request_context("/api/materiales/5", method="DELETE"):
        session["usuario"] = {"id": 7, "nombre": "Ana", "rol": "empleado"}
        assert registro_permisos.autorizar_cambio()[1] == 403


def test_empleado_agrega_datos_a_planilla_ajena():
    aplicacion = Flask(__name__)
    aplicacion.secret_key = "pruebas"
    with aplicacion.test_request_context("/api/planillas/5/operarios", method="POST", json={"etapa": "corte", "nombre_operario": "Luis"}):
        session["usuario"] = {"id": 7, "nombre": "Ana", "rol": "empleado"}
        assert registro_permisos.autorizar_cambio() is None


def test_registra_ultima_actualizacion_solo_si_la_edicion_termino_bien(monkeypatch):
    conexion = MagicMock()
    monkeypatch.setattr(registro_permisos, "get_connection", lambda: conexion)
    aplicacion = Flask(__name__)
    aplicacion.secret_key = "pruebas"
    with aplicacion.test_request_context("/api/ordenes/5", method="PUT"):
        session["usuario"] = {"id": 7, "nombre": "Ana", "rol": "empleado"}
        registro_permisos.enriquecer_respuesta(jsonify({"ok": True}))
        assert any("INSERT INTO registro_actualizacion" in llamada.args[0]
                   for llamada in conexion.cursor.return_value.execute.call_args_list)
        conexion.commit.assert_called_once()
    conexion.reset_mock()
    with aplicacion.test_request_context("/api/ordenes/5", method="PUT"):
        session["usuario"] = {"id": 7, "nombre": "Ana", "rol": "empleado"}
        respuesta = jsonify({"error": "inválido"})
        respuesta.status_code = 400
        registro_permisos.enriquecer_respuesta(respuesta)
        conexion.commit.assert_not_called()


def test_editar_orden_actualiza_tambien_la_marca_de_su_planilla(monkeypatch):
    conexion = MagicMock()
    monkeypatch.setattr(registro_permisos, "get_connection", lambda: conexion)
    aplicacion = Flask(__name__)
    aplicacion.secret_key = "pruebas"
    with aplicacion.test_request_context("/api/ordenes/5", method="PUT"):
        session["usuario"] = {"id": 8, "nombre": "Luis", "rol": "empleado"}
        registro_permisos.enriquecer_respuesta(jsonify({"id_orden": 5, "id_planilla": 9}))
    parametros = [llamada.args[1] for llamada in conexion.cursor.return_value.execute.call_args_list
                  if "INSERT INTO registro_actualizacion" in llamada.args[0]]
    assert ("ordenes", 5, 8, "Luis") in parametros
    assert ("planillas", 9, 8, "Luis") in parametros


def test_editar_linea_de_produccion_actualiza_planilla(monkeypatch):
    conexion = MagicMock()
    conexion.cursor.return_value.fetchone.return_value = {"id": 3}
    monkeypatch.setattr(registro_permisos, "get_connection", lambda: conexion)
    aplicacion = Flask(__name__)
    aplicacion.secret_key = "pruebas"
    with aplicacion.test_request_context("/api/produccion-diaria/linea/12", method="PUT"):
        session["usuario"] = {"id": 8, "nombre": "Luis", "rol": "empleado"}
        registro_permisos.enriquecer_respuesta(jsonify({"id_planilla": 9}))
    parametros = [llamada.args[1] for llamada in conexion.cursor.return_value.execute.call_args_list
                  if "INSERT INTO registro_actualizacion" in llamada.args[0]]
    assert ("produccion-diaria", 3, 8, "Luis") in parametros
    assert ("planillas", 9, 8, "Luis") in parametros


def test_nueva_produccion_marca_las_planillas_que_ya_existian(monkeypatch):
    conexion = MagicMock()
    monkeypatch.setattr(registro_permisos, "get_connection", lambda: conexion)
    aplicacion = Flask(__name__)
    aplicacion.secret_key = "pruebas"
    with aplicacion.test_request_context("/api/produccion-diaria/", method="POST"):
        session["usuario"] = {"id": 8, "nombre": "Luis", "rol": "empleado"}
        registro_permisos.enriquecer_respuesta(jsonify({
            "id_produccion_diaria": 3,
            "planillas_afectadas_ids": [9, 10],
            "planillas_creadas": [10],
        }))
    parametros = [llamada.args[1] for llamada in conexion.cursor.return_value.execute.call_args_list
                  if "INSERT INTO registro_actualizacion" in llamada.args[0]]
    assert parametros == [("planillas", 9, 8, "Luis")]


def test_get_muestra_autor_y_ultima_actualizacion(monkeypatch):
    conexion = MagicMock()
    conexion.cursor.return_value.fetchall.side_effect = [
        [{"registro_id": 5, "usuario_id": 7, "autor": "Ana", "creado_en": datetime(2026, 9, 17, 12)}],
        [{"registro_id": 5, "usuario": "Luis", "actualizado_en": datetime(2026, 9, 17, 16)}],
    ]
    monkeypatch.setattr(registro_permisos, "get_connection", lambda: conexion)
    aplicacion = Flask(__name__)
    aplicacion.secret_key = "pruebas"
    with aplicacion.test_request_context("/api/ordenes/", method="GET"):
        session["usuario"] = {"id": 7, "nombre": "Ana", "rol": "empleado"}
        respuesta = registro_permisos.enriquecer_respuesta(jsonify([{"id_orden": 5}]))
        orden = respuesta.get_json()[0]
        assert orden["autor"] == "Ana"
        assert orden["actualizado_por"] == "Luis"
        assert orden["actualizado_en"] == "2026-09-17T16:00:00+00:00"
