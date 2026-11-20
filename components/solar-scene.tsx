export default function SolarScene({className=''}:{className?:string}){
 return <svg className={className} viewBox="0 0 640 500" fill="none" role="img" aria-label="Illustration of a sunlit home with rooftop solar panels and a green garden">
 <circle cx="386" cy="232" r="204" fill="#E9ECFB"/><circle cx="482" cy="102" r="48" fill="#B8C4F7"/>
 <path d="M89 359L309 236L587 370L362 485L89 359Z" fill="#D6DDEF"/><path d="M89 359V371L362 499V485L89 359Z" fill="#BEC9E4"/><path d="M362 485L587 370V382L362 499V485Z" fill="#A4B4D6"/>
 <path d="M182 311L320 234L464 306V377L326 454L182 384V311Z" fill="#FCFCFF"/><path d="M326 330L464 255V377L326 454V330Z" fill="#DCE2F2"/>
 <path d="M159 285L300 203L489 292L345 374L159 285Z" fill="#8292BF"/><path d="M159 285L345 374V386L159 297V285Z" fill="#6173A8"/><path d="M345 374L489 292V304L345 386V374Z" fill="#485C98"/>
 <g transform="matrix(.92 .44 -.9 .52 301 222)"><rect width="171" height="113" rx="3" fill="#364A91" stroke="#D2DAF5" strokeWidth="3"/>{[0,1,2].map(i=>[0,1,2,3].map(j=><g key={`${i}${j}`}><rect x={5+j*42} y={5+i*36} width="36" height="30" rx="2" fill={(i+j)%2?'#596FD2':'#445BBA'} stroke="#A5B5E9" strokeWidth=".7"/><path d={`M${23+j*42} ${5+i*36}v30 M${5+j*42} ${20+i*36}h36`} stroke="#A5B5E9" strokeWidth=".6"/></g>))}</g>
 <path d="M207 328L249 349V396L207 375V328Z" fill="#376465"/><path d="M228 338V386M207 351L249 372" stroke="#B8D1CB" strokeWidth="3"/>
 <path d="M273 364L303 379V442L273 427V364Z" fill="#B48B63"/><path d="M295 406V413" stroke="#F9E9C7" strokeWidth="3"/>
 <path d="M355 384L393 363V405L355 426V384Z" fill="#547B75"/><path d="M374 373V415M355 405L393 384" stroke="#C1D2C8" strokeWidth="3"/>
 <path d="M414 351L446 334V374L414 392V351Z" fill="#547B75"/><path d="M430 342V382" stroke="#C1D2C8" strokeWidth="3"/>
 <path d="M274 427L305 442L273 460L243 445L274 427Z" fill="#DCD9C8"/>
 <path d="M122 357V286" stroke="#7D9273" strokeWidth="9"/><ellipse cx="122" cy="272" rx="38" ry="59" fill="#84A878"/><ellipse cx="113" cy="258" rx="26" ry="43" fill="#9DBD88"/>
 <path d="M520 368V294" stroke="#7D9273" strokeWidth="9"/><ellipse cx="520" cy="280" rx="34" ry="54" fill="#729766"/><ellipse cx="510" cy="269" rx="25" ry="40" fill="#93B07F"/>
 <ellipse cx="164" cy="380" rx="22" ry="13" fill="#7D9E6C"/><ellipse cx="464" cy="412" rx="26" ry="14" fill="#96B080"/>
 <path d="M106 167h60M136 137v60M526 192h28M540 178v28" stroke="#CFD7F5" strokeWidth="2"/>
 <path d="M70 220c30 0 30-40 60-40M510 435h70" stroke="#C7D1EE" strokeDasharray="5 7" strokeWidth="2"/>
 </svg>
}
