package com.github.magicsih.MatchSymbol.gameservices;

import android.content.Intent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.PlayGamesSdk;

/**
 * Google Play Games Services v2 기반 네이티브 리더보드 플러그인.
 *
 * standalone(Capacitor) Android 앱에서만 동작하며, JS 측 src/leaderboard 디스패처가
 * 호출한다. Play Console 게임 프로젝트 링크(fast-follow) 전에는 app id가
 * placeholder("0000000000") 상태라 초기화가 실패하는데, 초기화를 지연시키고
 * try/catch로 감싸 앱 크래시 없이 모든 메서드를 안전하게 no-op/실패 처리한다.
 */
@CapacitorPlugin(name = "GameServices")
public class GameServicesPlugin extends Plugin {

    private static final String PLACEHOLDER_APP_ID = "0000000000";
    private boolean sdkInitialized = false;

    /** app id가 실제 값일 때만 PlayGamesSdk를 1회 초기화한다. */
    private boolean ensureInitialized() {
        if (sdkInitialized) return true;

        String appId = readAppId();
        if (appId == null || appId.isEmpty() || PLACEHOLDER_APP_ID.equals(appId)) {
            return false;
        }

        try {
            PlayGamesSdk.initialize(getContext());
            sdkInitialized = true;
            return true;
        } catch (Throwable t) {
            return false;
        }
    }

    private String readAppId() {
        try {
            int resId = getContext()
                .getResources()
                .getIdentifier("game_services_app_id", "string", getContext().getPackageName());
            if (resId == 0) return null;
            return getContext().getString(resId);
        } catch (Throwable t) {
            return null;
        }
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        if (!ensureInitialized()) {
            JSObject ret = new JSObject();
            ret.put("available", false);
            call.resolve(ret);
            return;
        }

        PlayGames.getGamesSignInClient(getActivity())
            .isAuthenticated()
            .addOnCompleteListener(task -> {
                boolean ok = task.isSuccessful() && task.getResult().isAuthenticated();
                JSObject ret = new JSObject();
                ret.put("available", ok);
                call.resolve(ret);
            });
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        if (!ensureInitialized()) {
            resolveAuthenticated(call, false);
            return;
        }

        PlayGames.getGamesSignInClient(getActivity())
            .isAuthenticated()
            .addOnCompleteListener(task -> {
                boolean already = task.isSuccessful() && task.getResult().isAuthenticated();
                if (already) {
                    resolveAuthenticated(call, true);
                    return;
                }
                PlayGames.getGamesSignInClient(getActivity())
                    .signIn()
                    .addOnCompleteListener(signInTask -> {
                        boolean ok = signInTask.isSuccessful()
                            && signInTask.getResult().isAuthenticated();
                        resolveAuthenticated(call, ok);
                    });
            });
    }

    private void resolveAuthenticated(PluginCall call, boolean authenticated) {
        JSObject ret = new JSObject();
        ret.put("authenticated", authenticated);
        call.resolve(ret);
    }

    @PluginMethod
    public void submitScore(PluginCall call) {
        String leaderboardId = call.getString("leaderboardId");
        Double score = call.getDouble("score");
        if (leaderboardId == null || score == null) {
            call.reject("leaderboardId and score are required");
            return;
        }
        if (!ensureInitialized()) {
            call.reject("game services unavailable");
            return;
        }

        PlayGames.getLeaderboardsClient(getActivity())
            .submitScore(leaderboardId, Math.round(score));
        call.resolve();
    }

    @PluginMethod
    public void showLeaderboard(PluginCall call) {
        String leaderboardId = call.getString("leaderboardId");
        if (leaderboardId == null) {
            call.reject("leaderboardId is required");
            return;
        }
        if (!ensureInitialized()) {
            call.reject("game services unavailable");
            return;
        }

        PlayGames.getLeaderboardsClient(getActivity())
            .getLeaderboardIntent(leaderboardId)
            .addOnSuccessListener(intent ->
                startActivityForResult(call, intent, "leaderboardResult"))
            .addOnFailureListener(error ->
                call.reject(error.getMessage(), error));
    }

    @ActivityCallback
    private void leaderboardResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        // 리더보드 UI가 닫히면(취소/뒤로가기 포함) 정상 종료로 처리한다.
        call.resolve();
    }
}
