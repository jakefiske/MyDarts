class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {};
  private enabled: boolean = true;
  private volume: number = 0.7;
  private currentMusic: HTMLAudioElement | null = null;

  constructor() {
    // Sound effects
    this.preload('hit', '/sounds/mixkit-game-success-alert-2039.wav');
    this.preload('miss', '/sounds/mixkit-wrong-long-buzzer-954.wav');
    this.preload('bust', '/sounds/mixkit-cartoon-fail-blow-fart-3053.wav');
    this.preload('checkout', '/sounds/mixkit-huge-crowd-cheering-victory-462.wav');
    this.preload('oneEighty', '/sounds/ipl_latest_horn.mp3');
    this.preload('oneFourty', '/sounds/its-a-very-nice.mp3');
    this.preload('ton', '/sounds/owenwilson-wow.mp3');
    this.preload('bull', '/sounds/hawk-tuah.mp3');
    this.preload('gameStart', '/sounds/mixkit-unlock-game-notification-253.wav');
    this.preload('doubleIn', '/sounds/home-improvement-huh.mp3');
    this.preload('nelsonLaugh', '/sounds/the-simpsons-nelsons-haha.mp3');
    this.preload('ohhhh', '/sounds/ohhhhhhhhh.mp3');
    this.preload('ustoopid', '/sounds/ustoopid.mp3');
    
    // Music tracks
    this.preload('rockyTheme', '/sounds/rocky-theme-tune-mp3cut.mp3');
  }

  private preload(name: string, url: string) {
    const audio = new Audio();
    audio.src = url;
    audio.preload = 'auto';
    this.sounds[name] = audio;
  }

  play(name: string) {
    if (!this.enabled) return;

    const sound = this.sounds[name];
    if (sound) {
      const clone = sound.cloneNode() as HTMLAudioElement;
      clone.volume = this.volume;
      clone.play().catch(() => {});
    }
  }

  startMusic(name: string) {
    if (!this.enabled) return;
    
    this.stopMusic();

    const music = this.sounds[name];
    if (music) {
      this.currentMusic = music.cloneNode() as HTMLAudioElement;
      this.currentMusic.volume = this.volume * 0.5;
      this.currentMusic.loop = true;
      this.currentMusic.play().catch(() => {});
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.volume = this.volume * 0.5;
    }
  }

  isEnabled() {
    return this.enabled;
  }

  getVolume() {
    return this.volume;
  }
}

export const soundManager = new SoundManager();