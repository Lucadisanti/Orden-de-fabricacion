from flask import Blueprint
from controllers.auth_controller import iniciar_sesion, sesion_actual, cerrar_sesion, listar_usuarios, crear_usuario, actualizar_usuario, eliminar_usuario, generar_codigo_recuperacion, recuperar_contrasena
auth_bp=Blueprint("auth",__name__)
auth_bp.route("/login",methods=["POST"])(iniciar_sesion)
auth_bp.route("/me",methods=["GET"])(sesion_actual)
auth_bp.route("/logout",methods=["POST"])(cerrar_sesion)
auth_bp.route("/recuperar",methods=["POST"])(recuperar_contrasena)
auth_bp.route("/usuarios",methods=["GET"])(listar_usuarios)
auth_bp.route("/usuarios",methods=["POST"])(crear_usuario)
auth_bp.route("/usuarios/<int:id_usuario>",methods=["PUT"])(actualizar_usuario)
auth_bp.route("/usuarios/<int:id_usuario>",methods=["DELETE"])(eliminar_usuario)
auth_bp.route("/usuarios/<int:id_usuario>/recuperacion",methods=["POST"])(generar_codigo_recuperacion)
