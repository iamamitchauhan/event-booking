// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
	let { statusCode, message } = err;

	// res.locals.errorMessage = err.message;

	console.error(err);

	res.status(statusCode).send({
		code: statusCode,
		message
	});
};

module.exports = {
	errorHandler,
};
