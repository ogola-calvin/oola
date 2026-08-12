function success(res, data = {}, message = 'success', code = 200) {
  return res.status(code).json({ message, success: true, code, data });
}

function fail(res, message = 'error', code = 400, errors = null) {
  const body = { message, success: false, code };
  if (errors) body.errors = errors;
  return res.status(code).json(body);
}

module.exports = { success, fail };
