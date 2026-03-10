const es: Record<string, string> = {
  // User errors
  user_not_found: "Usuario no encontrado",
  user_not_authorized: "No tienes permisos para realizar esta acción",
  username_already_exists: "El nombre de usuario ya está en uso",
  username_too_short: "El nombre de usuario es demasiado corto",
  username_too_long: "El nombre de usuario es demasiado largo",
  password_too_short: "La contraseña es demasiado corta",
  password_too_long: "La contraseña es demasiado larga",
  password_week_upper_case_letter: "La contraseña debe contener al menos una mayúscula",
  password_week_lower_case_letter: "La contraseña debe contener al menos una minúscula",
  password_week_number: "La contraseña debe contener al menos un número",
  password_week_symbol: "La contraseña debe contener al menos un símbolo",
  password_verify_failed: "Usuario o contraseña incorrectos",
  user_save_failed: "Error al guardar el usuario",
  user_repo_error: "Error interno del servidor",
  user_cannot_deactivate_root: "No se puede desactivar un usuario root",
  user_cannot_revoke_self_meta_manage_permissions: "No se puede revocar el permiso de gestión de permisos meta a sí mismo",

  // Auth errors
  token_not_found: "Sesión no encontrada, inicia sesión nuevamente",
  token_verification_failed: "Sesión inválida, inicia sesión nuevamente",
  token_revoked: "Tu sesión fue revocada, inicia sesión nuevamente",
  token_expired: "Tu sesión expiró, inicia sesión nuevamente",

  // FAQ errors
  faq_item_not_found: "Pregunta frecuente no encontrada",
  faq_text_not_found: "Texto de FAQ no encontrado",
  faq_invalid_transition: "Transición de estado no válida para este FAQ",
  faq_not_authorized: "No tienes permisos para gestionar FAQ",
  faq_save_failed: "Error al guardar la pregunta frecuente",

  // Permission errors
  permission_not_authorized: "No tienes permisos para realizar esta acción",
  permission_invalid_action: "Acción de permiso no válida",
  permission_invalid_namespace: "Espacio de permisos no válido",
  permission_invalid_slug: "Permiso desconocido",

  // Success messages
  logout_success: "Sesión cerrada correctamente",
  password_updated: "Contraseña actualizada correctamente",
  user_deactivated: "Usuario desactivado correctamente",
  user_activated: "Usuario activado correctamente",
  admin_granted: "Permisos de administrador otorgados",
  admin_revoked: "Permisos de administrador revocados",
  root_granted: "Permisos de root otorgados",
  root_revoked: "Permisos de root revocados",
  permission_granted: "Permiso otorgado correctamente",
  permission_revoked: "Permiso revocado correctamente",

  // Generic
  unknown_error: "Ha ocurrido un error inesperado",
};

export function t(key: string): string {
  return es[key] ?? key;
}
