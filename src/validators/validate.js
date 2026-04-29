export default function validate(validator) {
  return (request) =>
    validator
      .transform(({ params, query, body, file, files, signedCookies }) => ({
        ...(!!params && params),
        ...(!!query && query),
        ...(!!body && body),
        ...(!!file && file), // Multer .single
        ...(!!files && files), // Multer .fields
        ...(!!signedCookies && signedCookies),
      }))
      .parse(request);
}
