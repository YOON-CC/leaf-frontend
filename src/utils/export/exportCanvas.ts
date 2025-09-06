/* eslint-disable @typescript-eslint/no-explicit-any */
export function exportCanvas({
  fabricCanvas,
  treeToCode,
  treeNodes,
  unlinkedNodes,
  scalingTargetValueRef,
  canvasBackgroundColor,
  setExportFile,
}: any) {
  if (!fabricCanvas.current) return;

  const canvasWidth = fabricCanvas.current.getWidth();
  const canvasHeight = 670; // 고정값

  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const scaleX = screenWidth / canvasWidth;
  const scaleY = screenHeight / canvasHeight;

  const code = treeToCode(
    treeNodes,
    unlinkedNodes,
    scalingTargetValueRef.current,
    0,
    0,
    0,
    scaleX,
    scaleY
  );

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Exported Tree</title>
        <style>
        body {
            margin: 0;
            height: 100vh;
            background-color: ${canvasBackgroundColor};
            overflow-x: hidden;
            position: relative;
            width: 100%;
        }

        #main {
            position: relative;
            background-color: ${canvasBackgroundColor};
            height: 100vh;
            width: ${screenWidth}px;
            max-width: 100vw;
            margin: 0 auto; 
        }
        </style>
    </head>
    <body>
      <div id="main">
        ${code}
      </div>
      <script>
        ${exportAnimationScript()}
      </script>
    </body>
    </html>
  `;

  setExportFile(htmlContent);
}

// 별도 애니메이션 스크립트를 함수로 분리
function exportAnimationScript() {
  return `
    document.addEventListener('DOMContentLoaded', () => {
        const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const el = entry.target;
            const animation = el.getAttribute('data-animation');
            if (!animation || el.dataset.animated === 'true') return;

            el.dataset.animated = 'true';
            
            // sticky 관련 애니메이션은 transition을 적용하지 않음
            const isStickyAnimation = ['sticky', 'stickyGently', 'stickyLater'].includes(animation);
            
            if (!isStickyAnimation) {
                // fadeIn, fadeOut의 경우 2초, 나머지는 0.8초
                if (animation === 'fadeIn' || animation === 'fadeOut') {
                    el.style.transition = 'opacity 2s ease';
                } else {
                    el.style.transition = 'all 0.8s ease';
                }
            }

            switch (animation) {
            case 'fadeIn':
                el.style.opacity = '1';
                break;
            case 'fadeOut':
                el.style.opacity = '0';
                break;
            case 'up':
            case 'down':
                el.style.transform = 'translateY(0)';
                el.style.opacity = '1';
                break;
            case 'left':
            case 'right':
                el.style.transform = 'translateX(0)';
                el.style.opacity = '1';
                break;
            case 'scaleUp':
            case 'scaleDown':
                el.style.transform = 'scale(1)';
                el.style.opacity = '1';
                break;
            case 'sticky':
                // 깜빡임 방지: 즉시 opacity를 1로 설정하고 position 변경
                el.style.opacity = '1';
                el.style.position = 'fixed';
                el.style.top = '0px';
                break;
            case 'stickyGently': {
                // 깜빡임 방지: 즉시 opacity를 1로 설정
                el.style.opacity = '1';
                const stickyTop = el.getBoundingClientRect().top + window.scrollY;
                const fixedTop = el.getBoundingClientRect().top;
                const fixedLeft = el.getBoundingClientRect().left;
                const originalWidth = el.offsetWidth;

                window.addEventListener('scroll', () => {
                el.style.top = window.scrollY + 'px';
                });
                break;
            }
            case 'stickyLater': {
                // 깜빡임 방지: 즉시 opacity를 1로 설정
                el.style.opacity = '1';
                const fixedLeft = el.getBoundingClientRect().left;
                const originalWidth = el.offsetWidth;
                const startTop = el.getBoundingClientRect().top;
                const halfWindowHeight = window.innerHeight / 2;
                let move = 0;
                const elementOriginalTop = el.getBoundingClientRect().top;
                window.addEventListener('scroll', () => {
                // 요소의 화면 내 top 위치
                const elementTop = el.getBoundingClientRect().top;
                console.log("오리지널 탑",startTop)
                

                    if (move > 100) {
                    return;
                    } 
                    else if(startTop < halfWindowHeight + el.offsetHeight/2){
                    el.style.top = scrollY + 'px';
                    move+=1;
                    }
                    else {
                    console.log("시작", elementTop, window.scrollY, halfWindowHeight, el.offsetHeight);

                    const newTop = window.scrollY - elementOriginalTop + el.offsetHeight / 2;
                    el.style.top = (newTop > 0 ? newTop : 0) + 'px';

                    move += 1;
                    console.log(move);
                    }
                });

                break;
            }
            }
        });
        }, { threshold: 0.1 });

        document.querySelectorAll('[data-animation]').forEach(el => {
        const animation = el.getAttribute('data-animation');
        
        // sticky 관련 애니메이션은 초기 opacity를 1로 설정 (깜빡임 방지)
        const isStickyAnimation = ['sticky', 'stickyGently', 'stickyLater'].includes(animation);
        
        if (isStickyAnimation) {
            el.style.opacity = '1';
        } else if (animation === 'fadeOut') {
            el.style.opacity = '1';
        } else {
            el.style.opacity = '0';
        }

        switch (animation) {
            case 'up':
            el.style.transform = 'translateY(70px)';
            break;
            case 'down':
            el.style.transform = 'translateY(-70px)';
            break;
            case 'left':
            el.style.transform = 'translateX(70px)';
            break;
            case 'right':
            el.style.transform = 'translateX(-70px)';
            break;
            case 'scaleUp':
            el.style.transform = 'scale(0.7)';
            break;
            case 'scaleDown':
            el.style.transform = 'scale(1.4)';
            break;
            case 'fadeIn':
            // fadeIn의 경우 초기 opacity는 0으로 유지
            break;
            case 'fadeOut':
            // fadeOut의 경우 초기 opacity는 1로 유지
            break;
            case 'sticky':
            case 'stickyGently':
            case 'stickyLater':
            // sticky 관련은 이미 위에서 opacity를 1로 설정했으므로 추가 처리 없음
            break;
        }
        
        // sticky가 아닌 fadeIn, fadeOut이 아닌 경우에만 opacity를 재설정
        if (!isStickyAnimation && animation !== 'fadeIn' && animation !== 'fadeOut') {
            el.style.opacity = '1';
        }

        observer.observe(el);
        });
    });
  `;
}
