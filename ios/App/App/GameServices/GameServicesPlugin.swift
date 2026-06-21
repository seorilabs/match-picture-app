import Capacitor
import Foundation
import GameKit

/**
 * GameKit 기반 네이티브 리더보드 플러그인 (iOS).
 *
 * standalone(Capacitor) iOS 앱에서만 동작하며, JS 측 src/leaderboard 디스패처가
 * 호출한다. Game Center 인증/리더보드 ID가 준비되지 않은 상황에서도 throw 대신
 * 의미 있는 결과를 돌려준다. (App Store Connect의 Game Center 리더보드 설정과
 * Game Center capability 활성화는 fast-follow)
 */
@objc(GameServicesPlugin)
public class GameServicesPlugin: CAPPlugin {

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": GKLocalPlayer.local.isAuthenticated])
    }

    @objc func signIn(_ call: CAPPluginCall) {
        authenticate { authenticated in
            call.resolve(["authenticated": authenticated])
        }
    }

    @objc func submitScore(_ call: CAPPluginCall) {
        guard let leaderboardId = call.getString("leaderboardId") else {
            call.reject("leaderboardId is required")
            return
        }
        let score = call.getInt("score") ?? 0

        authenticate { authenticated in
            guard authenticated else {
                call.reject("game center not authenticated")
                return
            }
            GKLeaderboard.submitScore(
                score,
                context: 0,
                player: GKLocalPlayer.local,
                leaderboardIDs: [leaderboardId]
            ) { error in
                if let error = error {
                    call.reject(error.localizedDescription, nil, error)
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func showLeaderboard(_ call: CAPPluginCall) {
        guard let leaderboardId = call.getString("leaderboardId") else {
            call.reject("leaderboardId is required")
            return
        }

        authenticate { [weak self] authenticated in
            guard authenticated else {
                call.reject("game center not authenticated")
                return
            }
            DispatchQueue.main.async {
                guard let self = self else { return }
                let controller = GKGameCenterViewController(
                    leaderboardID: leaderboardId,
                    playerScope: .global,
                    timeScope: .allTime
                )
                controller.gameCenterDelegate = self
                guard let presenter = self.bridge?.viewController else {
                    call.reject("no view controller to present from")
                    return
                }
                presenter.present(controller, animated: true)
                call.resolve()
            }
        }
    }

    /// Game Center 로그인. 이미 인증돼 있으면 바로 true, 아니면 인증 UI를 띄운다.
    private func authenticate(completion: @escaping (Bool) -> Void) {
        let localPlayer = GKLocalPlayer.local
        if localPlayer.isAuthenticated {
            completion(true)
            return
        }

        localPlayer.authenticateHandler = { [weak self] viewController, _ in
            DispatchQueue.main.async {
                if let viewController = viewController {
                    self?.bridge?.viewController?.present(viewController, animated: true)
                } else {
                    completion(localPlayer.isAuthenticated)
                }
            }
        }
    }
}

extension GameServicesPlugin: GKGameCenterControllerDelegate {
    public func gameCenterViewControllerDidFinish(
        _ gameCenterViewController: GKGameCenterViewController
    ) {
        gameCenterViewController.dismiss(animated: true)
    }
}
