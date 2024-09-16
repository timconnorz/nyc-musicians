const About = () => {
  return (
    <div className='text-left w-full p-4 sm:p-8 text-gray-300'>
      <p className='mb-4'>
        This newsletter is built for the musician community of NYC. It was born
        by necessity when the "NYC Musicians Wanted" group on{' '}
        <a
          href='https://www.facebook.com/groups/2021146228121097'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-400 hover:underline'
        >
          Facebook
        </a>{' '}
        became too large and noisy to moderate effectively.
      </p>
      <p>
        If you have any feedback or suggestions, please reach out to us at{' '}
        <a href='mailto:info@nyc-musicians-wanted.com'>
          info@nyc-musicians-wanted.com
        </a>
      </p>
      <p className='text-[#888] mt-4'>Site Last Updated Sep 16 2024</p>
    </div>
  );
};

export default About;
