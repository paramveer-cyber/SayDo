export const ok = (res, message, data = null, status = 200) => {
    const body = { success: true, message };
    if (data !== null)
        body.data = data;
    return res.status(status).json(body);
};
export const created = (res, message, data = null) => ok(res, message, data, 201);
export const fail = (res, message, status = 400, errors = null) => {
    const body = { success: false, message };
    if (errors !== null)
        body.errors = errors;
    return res.status(status).json(body);
};
//# sourceMappingURL=response.js.map