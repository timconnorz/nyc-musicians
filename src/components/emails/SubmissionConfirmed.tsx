import * as React from 'react';

interface SubmissionConfirmedProps {}

export const SubmissionConfirmed: React.FC<
  Readonly<SubmissionConfirmedProps>
> = () => (
  <div>
    <h3>Thanks for your submission!</h3>
    <p>
      If your submission follows our rules, it will be added to our next
      newsletter. Thanks for supporting NYC Musicians!
    </p>
    <p>--</p>
    <a href='https://nycmusicianswanted.com'>NYC Musicians Wanted</a>
  </div>
);

export default SubmissionConfirmed;
