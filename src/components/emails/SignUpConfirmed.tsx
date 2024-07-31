import * as React from 'react';

interface SignUpConfirmedProps {}

const SignUpConfirmed: React.FC<Readonly<SignUpConfirmedProps>> = () => (
  <div>
    <h3>Thanks for signing up!</h3>
    <p>
      You'll now receive our newsletter with the latest music opportunities in
      NYC.
    </p>
    <p>--</p>
    <a href='https://nycmusicianswanted.com'>NYC Musicians Wanted</a>
  </div>
);

export default SignUpConfirmed;
