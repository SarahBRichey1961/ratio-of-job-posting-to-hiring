import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  render() {
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

    return (
      <Html lang="en">
        <Head>
          {/* Paddle.js for Overlay Checkout */}
          <script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  var token = '${process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || ''}';
                  if (window.Paddle && token) {
                    if (token.startsWith('test_')) {
                      window.Paddle.Environment.set('sandbox');
                    }
                    window.Paddle.Initialize({ token: token });
                  }
                })();
              `,
            }}
          ></script>

          {/* Google Analytics 4 */}
          {gaId && (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              ></script>
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${gaId}', {
                      page_path: window.location.pathname,
                    });
                  `,
                }}
              ></script>
            </>
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

