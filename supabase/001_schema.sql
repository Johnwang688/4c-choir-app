-- Create the songs table
CREATE TABLE songs (
  id             text PRIMARY KEY,
  title          text NOT NULL,
  author         text NOT NULL DEFAULT '',
  sheet_music_url text NOT NULL DEFAULT '',
  youtube_url    text NOT NULL DEFAULT ''
);

-- Allow anyone (including unauthenticated) to read songs.
-- Writes (INSERT/UPDATE/DELETE) are performed server-side using the service_role key,
-- which bypasses RLS entirely — no additional write policy is needed.
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON songs FOR SELECT USING (true);

-- Seed with your existing songs
INSERT INTO songs (id, title, author, sheet_music_url, youtube_url) VALUES
('CFqRwtdMHarsXkCpuuoW23','若有人在基督里','纪文惠、蔡佳灵创作','https://drive.google.com/file/d/1T8t9NVQxZcwymKUkQNjYidQh8_T0YR0U/view?usp=drive_link','https://www.youtube.com/watch?v=hr9ZyP1SElE'),
('7Kqq1oFWHQLkzdMKfZKGSa','有一位神','赞美之泉','https://drive.google.com/file/d/1KPiVPzbtxdisTfjr5YI9dGZkBHwBXvuL/view?usp=sharing','https://www.youtube.com/watch?v=b3oivk4W7EY'),
('9LFEMVYawz7fhJswSbQhjF','满有能力','赞美之泉','https://drive.google.com/file/d/1ATPAt4N7Msm1QUXw3uVJkhwfceRrLC4J/view?usp=sharing','https://www.youtube.com/watch?v=uTGPl8f-reQ'),
('XEAnTRew1RWkAmCWqeXUFz','我知所信的是谁','词：Daniel W. Whittle / 曲：James McGranahan','https://drive.google.com/file/d/1g3YKqxEqJOiZjWBw-PND2mtVxF1Ppu3w/view?usp=drive_link','https://www.youtube.com/watch?v=17pRa82CEQs'),
('VU2maaJTuavJ9BKqjJDNsR','耶和华行了个大事','赞美之泉','https://drive.google.com/file/d/1cdzTGKLmr9FsB2jTRluh6XZs8i7I0V7G/view?usp=drive_link','https://www.youtube.com/watch?v=lI7O8Ta-8aw'),
('YKTbPuukaEPKAzyp7Bu8p9','能不能','赞美之泉','https://drive.google.com/file/d/169l1o4vJz_qZ1oxKq-_iFdE_sEp_yL57/view?usp=sharing','https://www.youtube.com/watch?v=rZw6z8hH7Jc'),
('GhU6nqt5P5sbb5EFrhGgHa','信靠每一句应许','赞美之泉','https://drive.google.com/file/d/1NiwSqFnY8LDVjVy7J89adGL8aF0PSTfB/view?usp=drive_link','https://www.youtube.com/watch?v=hQ6Uz6Uhesw'),
('VL5adygGqBmJYWVrMeYmQb','住在你里面','赞美之泉','https://drive.google.com/file/d/1H9-UwNGAlXPzwzOKuQiCgrCYCxUyvrId/view?usp=drive_link','https://www.youtube.com/watch?v=IKGazOdWmH4'),
('CAGr9SgUVk9RGNEhRA9X92','歌颂复活主','葉薇心','https://drive.google.com/file/d/15NyaUvgVncpMJYlPwvgCbX75-ts9CX4T/view?usp=sharing','https://www.youtube.com/watch?v=6-thSdwWI9A'),
('B36bFJ18F2k93dWaVQmWuQ','主的喜乐是我力量','曾祥怡','https://drive.google.com/file/d/1TtGdjg6UdcGvn2JmAs9Y_oJcbDK29AQ4/view?usp=sharing','https://www.youtube.com/watch?v=MEHMGqHh9ZY'),
('GgupYGupQUn1nrWfhR9x3Z','因他活着','William J. Gaither','https://drive.google.com/file/d/1pXRau8wkuusGLn9SZ15WldMnLdQEfTdW/view?usp=sharing','https://www.youtube.com/watch?v=r1Fzv-GHN7k'),
('J2atTjHkmGDWu3tGrgN9qT','这一生最美的祝福','赞美之泉','https://drive.google.com/file/d/1bLQGXsmmObsZm3Wh-sHX6afJ7ZCmiPUd/view?usp=sharing','https://www.youtube.com/watch?v=tPf7Ig1ebL4'),
('33RNYcoqe5WHanXdYcNXTH','赞美之泉','赞美之泉','https://drive.google.com/file/d/1bDsjBizHQo6GZi1sYS63cENdSjHmQhXD/view?usp=sharing','https://www.youtube.com/watch?v=x-DysGdCg4k'),
('TaDX7rrXCe7knJCprNAoxm','小小的梦想','赞美之泉','https://drive.google.com/file/d/1RpAg0WfUeODGzj6AQ6h8iVe3P4S8HV82/view?usp=sharing','https://www.youtube.com/watch?v=D365p9i7T9U'),
('7bdV3GiJiJWq2TjaJikp8C','云上太阳','赞美之泉','https://drive.google.com/file/d/1bNEbqofsnnlY_xwmtaB4PQ9J7YWqhJ9_/view?usp=sharing','https://www.youtube.com/watch?v=61e4JlANH2Q'),
('HP2ajfRieaCdSxSrzN2Q7B','恩典之路','赞美之泉','https://drive.google.com/file/d/16x1RXprPRsozCniMv-aD9d2ivPjnt7PV/view?usp=sharing','https://www.youtube.com/watch?v=0Q444bzsehU'),
('A57V5MjkghjnJgEQT1c8NX','轻轻听','陈天赐','https://drive.google.com/file/d/1hPintCkdZvCS5GG78D_JXigqfKoJQe8X/view?usp=sharing','https://www.youtube.com/watch?v=hIGtN2xHWsw'),
('LYjsGPx9dz2uwDK2sfFD5S','将天敞开','赞美之泉','https://drive.google.com/file/d/1wRg2kiWknwAchAJULqymDE4poiqr5S0R/view?usp=sharing','https://www.youtube.com/watch?v=OVUPLFLdmpE'),
('CoNcsyFMADzdfDuVFkgjeY','主啊 我到你面前','唐瑛琦','https://drive.google.com/file/d/1D8BFoFjc-Ni_wsueaLpZyKLacqc4pigf/view?usp=sharing','https://www.youtube.com/watch?v=Bvv3XiWrmsA'),
('SbYkMxqUy7fFTfzdQaS8tz','奇异恩典','John Newton; John P. Rees (stanza)','https://drive.google.com/file/d/1GVn5HW-6Z2Tk5yhNk84_4gUhSHhQrnil/view?usp=sharing','https://www.youtube.com/watch?v=GIu-Zw5lf0s'),
('C1zmpdpi3VfqDcSi1K4bG1','大山为我挪开','赞美之泉','https://drive.google.com/file/d/1_nkvexxRuLxxYlJlhrQhbejRFnj8PfbI/view?usp=sharing','https://www.youtube.com/watch?v=_xJkYVZ50p0'),
('Sr4VEXDErmGHhDicEPx2vV','这世代','赞美之泉','https://drive.google.com/file/d/1s46GIOM14-BF9N9TsKlbdzv-72ZDbNC-/view?usp=sharing','https://www.youtube.com/watch?v=1MFGUd12VDo'),
('FLMCKpTu72xb21qtnj2wC8','Reckless Love','Cory Asbury, Caleb Culver · Ran Jackson','https://drive.google.com/file/d/1tyVCKhpxuTck_OPO0NqyXBWSBBZeekB3/view?usp=sharing','https://www.youtube.com/watch?v=Sc6SSHuZvQE'),
('W8DrfVvUjAz4r37LEY5FKJ','脚步','盛晓玫','https://drive.google.com/file/d/1qETP7XJ9ebl55jdjGfKFb-uHQKXtt5z_/view?usp=sharing','https://www.youtube.com/watch?v=xfXiROE1BdY'),
('UATm5FNHgqb52kFHLu6WjN','Holy Forever','Chris Tomlin, Jenn Johnson, Brian Johnson, Jason Ingram, Phil Wickham','https://drive.google.com/file/d/1hO_zBNwNoRXqiN4O0eYUUSq5Vzn4Gjqz/view?usp=sharing','https://www.youtube.com/watch?v=IkHgxKemCRk'),
('QjUvRdfAHhwVxbfyA6Zz3T','更新我心意','Eddie Espinosa','https://drive.google.com/file/d/119HrOukMrq_pJjJ8416c0aZSdsajhGFX/view?usp=sharing','https://www.youtube.com/watch?v=rlED-eLd5ow'),
('KRDJGwWf2cEcr4RnWEsszM','普世欢腾','以撒·华兹 (Isaac Watts)','https://drive.google.com/file/d/10zgUG5eLNAF5FYPp3e4fL9vgyYI2vupV/view?usp=sharing','https://www.youtube.com/watch?v=lUQPiFzBudE'),
('Vx2ZNEgpSD8g4kAfVyfot4','我们的神','赞美之泉','https://drive.google.com/file/d/14shQGdrB_jmEd0J8V_V0B7jw9C-yb4do/view?usp=sharing','https://www.youtube.com/watch?v=kvrRtRe9AoU'),
('7FmakpmZLticvJb53WLgbZ','一生爱你','赞美之泉','https://drive.google.com/file/d/1hWQFOFAYbwccAdcw0oSlwm5SXn1doJPO/view?usp=sharing','https://www.youtube.com/watch?v=fgHBHUPiaJI');
