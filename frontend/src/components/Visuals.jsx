import React from 'react';

/** Abstract UI illustration only. It is not a satellite image or model result. */
export function AerialPreview({ large = false, overlay = false }) {
  return <div className={`aerial-preview ${large ? 'large' : ''}`}>
    <svg viewBox="0 0 960 360" role="img" aria-label="Abstract landscape interface illustration, not geospatial data" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="scene" x2="0" y2="1"><stop stopColor="#c5d1bd"/><stop offset="1" stopColor="#93a58d"/></linearGradient><pattern id="blocks" width="110" height="70" patternTransform="rotate(-10)" patternUnits="userSpaceOnUse"><rect width="110" height="70" fill="#aab99f"/><path d="M0 0h50v70H0z" fill="#bac6a8"/><path d="M61 0h49v70H61z" fill="#92a58b"/><path d="M0 34h110" stroke="#e7e4cc" strokeWidth="3"/></pattern></defs>
      <rect width="960" height="360" fill="url(#scene)"/><rect width="960" height="360" fill="url(#blocks)" opacity=".82"/>
      <path d="M-20 112C105 78 137 192 267 177s171-101 264-72 124 94 208 73 153-78 245-49v84c-91-30-136 41-226 45s-139-66-212-50-159 108-267 76S110 240-20 278Z" fill="#4c8792" opacity=".86"/>
      {overlay&&<path d="M-20 112C105 78 137 192 267 177s171-101 264-72 124 94 208 73 153-78 245-49v84c-91-30-136 41-226 45s-139-66-212-50-159 108-267 76S110 240-20 278Z" fill="#30bda9" opacity=".48"/>}
      <path d="M-5 165C120 138 155 232 280 218s164-81 258-60 124 69 208 54 153-56 220-35" fill="none" stroke="#d7e7d5" strokeWidth="4" opacity=".58"/>
      <g fill="#70886e" opacity=".8">{Array.from({length:15},(_,i)=><circle key={i} cx={35+(i*151)%890} cy={22+(i*71)%315} r={11+(i%4)*3}/>)}</g>
    </svg>
    <span className="illustration-label">Illustrative interface concept · not analysis output</span>
  </div>;
}
