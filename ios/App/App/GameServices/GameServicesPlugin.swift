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

    /// 인증 완료를 기다리는 콜백들. 단일 authenticateHandler가 한 번에 깨운다.
    private var pendingAuthCompletions: [(Bool) -> Void] = []
    /// GKLocalPlayer.authenticateHandler를 1회만 등록하기 위한 플래그.
    private var authenticateHandlerInstalled = false
    /// 인증 시도가 실패로 종료됐는지. 이후 호출이 무한 대기하지 않도록 한다.
    private var authFailedAndSettled = false
    /// 리더보드 UI가 닫힐 때 단일 시점에 resolve하기 위해 보관하는 call.
    private var leaderboardCall: CAPPluginCall?

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
        // JS(clearTimeToNativeScore)는 정수 number를 넘기지만, 음수/NaN 등
        // 잘못된 값은 명시적으로 실패시킨다.
        guard let scoreValue = call.getDouble("score"),
              scoreValue.isFinite, scoreValue >= 0 else {
            call.reject("score must be a non-negative finite number")
            return
        }
        let score = Int(scoreValue.rounded())

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
            guard let self = self else { return }
            guard authenticated else {
                call.reject("game center not authenticated")
                return
            }
            DispatchQueue.main.async {
                guard let presenter = self.bridge?.viewController else {
                    call.reject("no view controller to present from")
                    return
                }
                let controller = GKGameCenterViewController(
                    leaderboardID: leaderboardId,
                    playerScope: .global,
                    timeScope: .allTime
                )
                controller.gameCenterDelegate = self
                // resolve는 gameCenterViewControllerDidFinish에서 단일 시점에 수행한다.
                // (Android의 leaderboardResult ActivityCallback과 대칭)
                self.leaderboardCall = call
                presenter.present(controller, animated: true)
            }
        }
    }

    /**
     * Game Center 인증. authenticateHandler는 GameKit 특성상 1회만 등록하고,
     * 대기 중인 콜백들을 결과로 한 번에 깨운다. 이미 인증됐으면 즉시 true,
     * 이전 인증이 실패로 종료된 뒤라면 즉시 false로 응답해 hang을 방지한다.
     */
    private func authenticate(completion: @escaping (Bool) -> Void) {
        let localPlayer = GKLocalPlayer.local
        if localPlayer.isAuthenticated {
            completion(true)
            return
        }
        if authFailedAndSettled {
            completion(false)
            return
        }

        pendingAuthCompletions.append(completion)
        if authenticateHandlerInstalled { return }
        authenticateHandlerInstalled = true

        localPlayer.authenticateHandler = { [weak self] viewController, _ in
            DispatchQueue.main.async {
                guard let self = self else { return }
                if let viewController = viewController {
                    self.bridge?.viewController?.present(viewController, animated: true)
                    return
                }
                let authenticated = GKLocalPlayer.local.isAuthenticated
                self.authFailedAndSettled = !authenticated
                let completions = self.pendingAuthCompletions
                self.pendingAuthCompletions.removeAll()
                completions.forEach { $0(authenticated) }
            }
        }
    }
}

extension GameServicesPlugin: GKGameCenterControllerDelegate {
    public func gameCenterViewControllerDidFinish(
        _ gameCenterViewController: GKGameCenterViewController
    ) {
        gameCenterViewController.dismiss(animated: true) { [weak self] in
            self?.leaderboardCall?.resolve()
            self?.leaderboardCall = nil
        }
    }
}
