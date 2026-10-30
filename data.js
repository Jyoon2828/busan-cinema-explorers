/* Official sources verified 2026-10-30. The student's interpretation is not pre-filled. */
window.CINEMA_DATA = [
  {
    id: 'lotte', name: '롯데시네마 동래점', short: '롯데시네마 동래점', area: '동래구', color: '#d46b4a',
    badge: '함께 가 볼 곳', eyebrow: '11월의 현장 체험',
    address: '부산 동래구 중앙대로 1393 (온천동)',
    location: '도시철도 1호선 명륜역 가까이, 롯데백화점 동래점에 있어요.',
    summary: '여러 상영관을 갖춘 영화관이에요. 우리가 함께 영화를 볼 곳의 모습과 이용 방법을 조사해 봐요.',
    cover: 'assets/lotte-exterior.jpg', coverAlt: '롯데시네마 동래점이 있는 롯데백화점 동래점 건물',
    coverCredit: '롯데백화점 동래점 제공',
    official: 'https://www.lottecinema.co.kr/NLCHS/Cinema/Detail?divisionCode=1&detailDivisionCode=101&cinemaID=2007',
    sources: [
      {name: '롯데시네마 동래 공식 지점 안내', url: 'https://www.lottecinema.co.kr/NLCHS/Cinema/Detail?divisionCode=1&detailDivisionCode=101&cinemaID=2007'},
      {name: '롯데백화점 동래점 공식 안내', url: 'https://www.lotteshopping.com/store/main?cstrCd=0016'},
      {name: '건물 사진 원문 · 롯데백화점 제공 / 연합뉴스', url: 'https://www.yna.co.kr/view/AKR20250820056100051'}
    ],
    evidence: [
      {id: 'lotte-building', kind: 'photo', title: '영화관이 있는 건물', image: 'assets/lotte-exterior.jpg',
       alt: '영화관이 들어서 있는 롯데백화점 동래점의 바깥 모습', credit: '사진: 롯데백화점 동래점 제공 · 연합뉴스 / 건물 외관 자료 사진',
       text: '롯데시네마 동래점은 롯데백화점 동래점에 있어요. 영화관이 어떤 건물과 주변 환경에 있는지 살펴보세요.',
       question: '사람들은 영화를 보기 전이나 본 뒤에 무엇을 할 수 있을까요?', source: 1},
      {id: 'lotte-screens', kind: 'facts', title: '공식 안내에서 찾은 상영관', number: '9', unit: '개의 상영관', sub: '총 1,581석 · 2026.10.30 공식 안내 기준',
       text: '상영관은 큰 화면과 관객석이 있는, 영화를 보는 방이에요. 공식 안내에는 동래점에 상영관 9개와 좌석 1,581석이 있다고 나와 있어요.',
       question: '여러 상영관이 있으면 어떤 점이 편리할까요?', source: 0},
      {id: 'lotte-transport', kind: 'location', title: '동네와 이어지는 영화관', line: '도시철도 1호선', station: '명륜역',
       text: '롯데시네마 공식 안내에는 명륜역에서 롯데백화점 방향의 연결 육교를 이용하는 길이 소개되어 있어요. 버스를 타고 가는 방법도 안내해요.',
       question: '교통편을 안내하는 것은 영화관을 찾는 사람들에게 어떤 도움이 될까요?', source: 0}
    ],
    lookFor: '상영관 입구, 로비, 좌석 안내, 사람들이 함께 기다리는 모습을 관찰해 봐요.'
  },
  {
    id: 'dureraum', name: '영화의전당', short: '영화의전당', area: '해운대구', color: '#437f8b',
    badge: '1학기에 다녀온 곳', eyebrow: '우리의 지난 경험',
    address: '부산 해운대구 수영강변대로 120',
    location: '해운대구 센텀시티, 수영강 가까이에 있어요.',
    summary: '영화 상영관과 공연장, 영화 전문 도서관, 어린이 체험 공간 등이 함께 있는 곳이에요. 1학기 방문을 떠올리며 살펴봐요.',
    cover: 'assets/dureraum-exterior.jpg', coverAlt: '큰 지붕과 야외 공간이 있는 영화의전당 전경',
    coverCredit: '한국관광공사 대한민국 구석구석 · 정철훈',
    official: 'https://www.dureraum.org',
    sources: [
      {name: '한국관광공사 · 영화의전당 소개', url: 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=656efcc1-b2b7-4dac-9195-91b6af5ae341'},
      {name: '부산 관광 아카이브 · 영화의전당 라이브러리', url: 'https://visitbusan.net/archive/dataSearch/view.nm?dataSid=METADATA019532&menuCd=36'},
      {name: '부산광역시 · 영화의전당 들락날락', url: 'https://www.busan.go.kr/bschild/dnol/view.nm?menuCd=8&olSkey=DNOL0000000000039'}
    ],
    evidence: [
      {id: 'dureraum-building', kind: 'photo', title: '큰 지붕 아래의 영화 공간', image: 'assets/dureraum-exterior.jpg',
       alt: '영화의전당의 건물과 큰 지붕, 야외 공간', credit: '사진: 한국관광공사 대한민국 구석구석 · 정철훈(여행작가) / 자료 사진',
       text: '영화의전당에는 영화를 보는 상영관뿐 아니라 공연을 보는 공간과 야외 공간도 있어요. 부산국제영화제의 주요 행사도 열려요.',
       question: '여러 사람이 함께 모일 수 있는 공간이 있으면 무엇을 할 수 있을까요?', source: 0},
      {id: 'dureraum-library', kind: 'photo', title: '영화 전문 도서관', image: 'assets/library.png',
       alt: '영화의전당 라이브러리의 영화 포스터와 영상 열람 공간', credit: '사진: 부산관광공사 · 부산 관광 아카이브 / 공공누리 제2유형',
       text: '영화의전당에는 영화 전문 도서관인 라이브러리가 있어요. 영화 관련 책과 시나리오, 영화 음악과 영상 자료 등을 살펴볼 수 있어요.',
       question: '영화를 본 뒤 관련 책이나 자료를 찾아보면 무엇을 더 알 수 있을까요?', source: 1},
      {id: 'dureraum-kids', kind: 'reading', title: '어린이를 위한 들락날락', symbol: '✦',
       text: '영화의전당 비프힐 1층에는 어린이 문화 공간인 들락날락이 있어요. 어린이 도서관, 키즈영화관과 영화·예술 체험 프로그램을 안내하고 있어요.',
       question: '어린이를 위한 공간과 체험이 마련되어 있다는 것은 어떤 점에서 좋을까요?', source: 2}
    ],
    lookFor: '우리 반이 실제로 이용했던 곳과 이번 자료에서 새롭게 알게 된 곳을 구분해 봐요.'
  },
  {
    id: 'corner', name: '모퉁이극장', short: '모퉁이극장', area: '중구', color: '#8670a4',
    badge: '새롭게 알아볼 곳', eyebrow: '다양한 영화와의 만남',
    address: '부산 중구 광복중앙로 13, 3층',
    location: '중구 원도심의 BNK부산은행 아트시네마 안에 있어요.',
    summary: '다양한 독립·예술영화를 만나고, 영화를 주제로 이야기를 나누는 활동을 알아볼 수 있는 영화관이에요.',
    cover: 'assets/corner-exterior.jpg', coverAlt: 'BNK부산은행 아트시네마 모퉁이극장의 모습',
    coverCredit: '한국관광공사 대한민국 구석구석',
    official: 'https://blog.naver.com/cornertheate',
    sources: [
      {name: '한국관광공사 · 모퉁이극장 소개', url: 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=4c289c9e-a789-4f55-b09f-258230e3b11a'},
      {name: '부산문화재단 · 모퉁이극장', url: 'https://bsarte.bscf.or.kr/map/view/67'},
      {name: '한국문화정보원 문화포털 · 모퉁이극장 영상', url: 'https://culture.go.kr/portal/cltLife/cltVideo/viewPortal.do?category=&idx=8587&menuNo=200046&pageIndex=1'}
    ],
    evidence: [
      {id: 'corner-space', kind: 'photo', title: '원도심에서 만나는 영화관', image: 'assets/corner-exterior.jpg',
       alt: '모퉁이극장이 있는 BNK부산은행 아트시네마의 바깥 모습', credit: '사진: 한국관광공사 대한민국 구석구석 / 건물 외관 자료 사진',
       text: '모퉁이극장은 부산 중구에 있는 영화관이에요. BNK부산은행 아트시네마 3층에서 관객을 만나요.',
       question: '우리에게 익숙한 영화관의 모습과 어떤 점이 같고 다른가요?', source: 0},
      {id: 'corner-films', kind: 'reading', title: '다양한 영화와 만나기', symbol: '▥',
       text: '한국관광공사 소개에는 모퉁이극장이 독립영화와 예술영화를 상영한다고 나와 있어요. 널리 알려진 영화 외에도 여러 작품을 만나 볼 수 있어요.',
       word: '독립영화: 큰 영화 회사의 제작 방식에서 벗어나, 만드는 사람의 생각을 담아 제작하는 영화예요.',
       question: '서로 다른 이야기를 담은 영화를 볼 수 있다면 어떤 점이 좋을까요?', source: 0},
      {id: 'corner-talk', kind: 'reading', title: '영화 이야기를 나누는 시간', symbol: '“ ”',
       text: '모퉁이극장 소개에는 영화 관련 강연과 토크쇼 같은 문화 프로그램도 안내되어 있어요. 영화를 보고 느낀 점이나 궁금한 점을 함께 나눌 수 있어요.',
       question: '같은 영화를 본 사람들의 생각을 들어 보면 무엇을 발견할 수 있을까요?', source: 0}
    ],
    lookFor: '영화관의 크기뿐 아니라 어떤 작품과 사람을 만날 수 있는지도 살펴봐요.'
  }
];
