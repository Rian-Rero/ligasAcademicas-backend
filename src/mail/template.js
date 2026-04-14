import { html } from 'code-tag';

const template = (body) => html`
  <!DOCTYPE html>
  <html
    lang="en"
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:o="urn:schemas-microsoft-com:office:office"
  >
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta name="x-apple-disable-message-reformatting" />
      <title></title>
      <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
      <![endif]-->
      <style>
        table,
        td,
        div,
        h1,
        h2,
        h3,
        p {
          font-family: Arial, sans-serif;
        }

        /* table,
        td {
          border: 2px solid #000000 !important;
        } */

        h1 {
          font-size: 20px;
          font-weight: bold;
        }
        h2 {
          font-size: 15px;
          font-weight: 400;
        }
      </style>
    </head>
    <body>
      ${body}
    </body>
  </html>
`;

export default template;
